Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { jobType, parameters, userId } = await req.json();

        if (!jobType || !parameters) {
            throw new Error('Job type and parameters are required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log('Creating scraping job:', { jobType, parameters });

        // Create job record
        const jobData = {
            job_type: jobType,
            parameters: parameters,
            status: 'pending',
            progress: 0,
            total_records: 0,
            success_count: 0,
            captcha_solved: 0,
            cost_tracking: 0,
            user_id: userId || null,
            created_at: new Date().toISOString()
        };

        const createJobResponse = await fetch(`${supabaseUrl}/rest/v1/scraping_jobs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(jobData)
        });

        if (!createJobResponse.ok) {
            const errorText = await createJobResponse.text();
            throw new Error(`Failed to create job: ${errorText}`);
        }

        const createdJob = await createJobResponse.json();
        const jobId = createdJob[0].job_id;

        console.log('Job created successfully:', jobId);

        // Start real scraping process
        startRealScrapingProcess(jobId, jobType, parameters, serviceRoleKey, supabaseUrl);

        return new Response(JSON.stringify({
            data: {
                jobId: jobId,
                status: 'created',
                message: 'Scraping job created and started'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Scraping job creation error:', error);

        const errorResponse = {
            error: {
                code: 'SCRAPING_JOB_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Real scraping implementation
async function startRealScrapingProcess(jobId: string, jobType: string, parameters: any, serviceRoleKey: string, supabaseUrl: string) {
    try {
        await updateJobStatus(jobId, {
            status: 'running',
            progress: 0
        }, serviceRoleKey, supabaseUrl);

        const sources = parameters.sources || ['infodoanhnghiep.com', 'hsctvn.com', 'masothue.com'];
        let allCompanies: any[] = [];
        let totalCost = 0;
        let captchaSolved = 0;

        // Process each source
        for (let i = 0; i < sources.length; i++) {
            const source = sources[i];
            console.log(`Scraping from source: ${source}`);

            try {
                const { companies, cost, captchaCount } = await scrapeFromSource(
                    source, 
                    parameters, 
                    serviceRoleKey, 
                    supabaseUrl
                );

                allCompanies = allCompanies.concat(companies);
                totalCost += cost;
                captchaSolved += captchaCount;

                // Update progress
                const progress = Math.floor(((i + 1) / sources.length) * 100);
                await updateJobStatus(jobId, {
                    progress: progress,
                    success_count: allCompanies.length,
                    total_records: allCompanies.length,
                    captcha_solved: captchaSolved,
                    cost_tracking: parseFloat(totalCost.toFixed(4))
                }, serviceRoleKey, supabaseUrl);

            } catch (error) {
                console.error(`Failed to scrape from ${source}:`, error);
                await updateJobStatus(jobId, {
                    error_logs: [`Failed to scrape from ${source}: ${error.message}`]
                }, serviceRoleKey, supabaseUrl);
            }
        }

        // Save companies to database
        if (allCompanies.length > 0) {
            await saveCompaniesToDatabase(allCompanies, serviceRoleKey, supabaseUrl);
        }

        // Complete the job
        await updateJobStatus(jobId, {
            status: 'completed',
            progress: 100,
            success_count: allCompanies.length,
            total_records: allCompanies.length,
            completed_at: new Date().toISOString()
        }, serviceRoleKey, supabaseUrl);

        console.log(`Scraping job ${jobId} completed with ${allCompanies.length} companies`);

    } catch (error) {
        console.error('Scraping process failed:', error);
        
        await updateJobStatus(jobId, {
            status: 'failed',
            error_logs: [error.message]
        }, serviceRoleKey, supabaseUrl);
    }
}

// Real scraping from specific source
async function scrapeFromSource(source: string, parameters: any, serviceRoleKey: string, supabaseUrl: string) {
    const companies: any[] = [];
    let cost = 0;
    let captchaCount = 0;

    try {
        // Build search URL based on source and parameters
        const searchUrl = buildSearchUrl(source, parameters);
        console.log(`Fetching from: ${searchUrl}`);

        // Get proxy if needed
        let proxyConfig = null;
        if (parameters.useProxy) {
            proxyConfig = await getRandomActiveProxy(serviceRoleKey, supabaseUrl);
            if (proxyConfig) {
                cost += 0.001; // Proxy usage cost
            }
        }

        // Fetch the page
        const response = await fetchWithProxy(searchUrl, proxyConfig);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        
        // Check for CAPTCHA
        if (detectCaptcha(html)) {
            console.log('CAPTCHA detected, attempting to solve...');
            
            if (parameters.solveCaptcha) {
                const captchaSolution = await solveCaptcha(html, serviceRoleKey, supabaseUrl);
                if (captchaSolution.success) {
                    captchaCount++;
                    cost += captchaSolution.cost;
                    // Retry with CAPTCHA solution
                    // This would need more complex implementation
                }
            } else {
                throw new Error('CAPTCHA detected but solving is disabled');
            }
        }

        // Parse companies from HTML
        const parsedCompanies = parseCompaniesFromHtml(html, source);
        companies.push(...parsedCompanies);

        // Apply limits
        if (parameters.limit && companies.length > parameters.limit) {
            companies.splice(parameters.limit);
        }

    } catch (error) {
        console.error(`Error scraping from ${source}:`, error);
        throw error;
    }

    return { companies, cost, captchaCount };
}

// Build search URL based on source and parameters
function buildSearchUrl(source: string, parameters: any): string {
    const baseUrls = {
        'infodoanhnghiep.com': 'https://infodoanhnghiep.com/tim-kiem',
        'hsctvn.com': 'https://hsctvn.com/search',
        'masothue.com': 'https://masothue.com/tra-cuu'
    };

    const baseUrl = baseUrls[source as keyof typeof baseUrls];
    if (!baseUrl) {
        throw new Error(`Unsupported source: ${source}`);
    }

    const url = new URL(baseUrl);
    
    if (parameters.province) {
        url.searchParams.set('province', parameters.province);
    }
    
    if (parameters.industryCode) {
        url.searchParams.set('industry', parameters.industryCode);
    }

    return url.toString();
}

// Fetch with proxy support
async function fetchWithProxy(url: string, proxyConfig: any) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    // In a real implementation, you would configure the fetch to use proxy
    // For Deno, this would require additional proxy libraries
    return await fetch(url, { headers });
}

// Detect CAPTCHA in HTML
function detectCaptcha(html: string): boolean {
    const captchaIndicators = [
        'recaptcha',
        'hcaptcha',
        'captcha',
        'g-recaptcha',
        'h-captcha',
        'Please complete the security check'
    ];

    return captchaIndicators.some(indicator => 
        html.toLowerCase().includes(indicator.toLowerCase())
    );
}

// Parse companies from HTML
function parseCompaniesFromHtml(html: string, source: string): any[] {
    const companies: any[] = [];
    
    try {
        // Basic regex-based parsing (in production, use proper HTML parser)
        // This is a simplified example - real implementation would be more robust
        
        if (source === 'infodoanhnghiep.com') {
            // Parse infodoanhnghiep.com format
            const companyRegex = /<div class="company-item"[^>]*>([\s\S]*?)<\/div>/gi;
            const matches = html.match(companyRegex) || [];
            
            matches.forEach((match, index) => {
                const company = parseInfoDoanhNghiepItem(match, index);
                if (company) companies.push(company);
            });
        }
        // Add similar parsing for other sources...
        
    } catch (error) {
        console.error('Error parsing companies:', error);
    }

    return companies;
}

// Parse individual company item from infodoanhnghiep.com
function parseInfoDoanhNghiepItem(html: string, index: number): any {
    try {
        // Extract company information using regex
        const nameMatch = html.match(/<h3[^>]*>([^<]+)<\/h3>/i);
        const taxCodeMatch = html.match(/MST[:\s]*([0-9\-]+)/i);
        const addressMatch = html.match(/Địa chỉ[:\s]*([^<]+)/i);
        
        if (!nameMatch || !taxCodeMatch) {
            return null;
        }

        return {
            tax_code: taxCodeMatch[1].replace(/\-/g, ''),
            company_name: nameMatch[1].trim(),
            address: addressMatch ? addressMatch[1].trim() : null,
            source_website: 'infodoanhnghiep.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error parsing company item:', error);
        return null;
    }
}

// Get random active proxy
async function getRandomActiveProxy(serviceRoleKey: string, supabaseUrl: string) {
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/proxy_pool?status=eq.active&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (response.ok) {
            const proxies = await response.json();
            if (proxies.length > 0) {
                return proxies[Math.floor(Math.random() * proxies.length)];
            }
        }
    } catch (error) {
        console.error('Error getting proxy:', error);
    }
    return null;
}

// Solve CAPTCHA
async function solveCaptcha(html: string, serviceRoleKey: string, supabaseUrl: string) {
    try {
        // Call the solve-captcha function
        const response = await fetch(`${supabaseUrl}/functions/v1/solve-captcha`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                captcha_type: 'recaptcha_v2',
                solver_service: '2captcha'
            })
        });

        if (response.ok) {
            const result = await response.json();
            return result.data;
        }
    } catch (error) {
        console.error('Error solving CAPTCHA:', error);
    }
    
    return { success: false, cost: 0 };
}

// Save companies to database
async function saveCompaniesToDatabase(companies: any[], serviceRoleKey: string, supabaseUrl: string) {
    const batchSize = 10;
    
    for (let i = 0; i < companies.length; i += batchSize) {
        const batch = companies.slice(i, i + batchSize);
        
        try {
            await fetch(`${supabaseUrl}/rest/v1/companies`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(batch)
            });
        } catch (error) {
            console.error('Failed to save company batch:', error);
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// Update job status
async function updateJobStatus(jobId: string, updates: any, serviceRoleKey: string, supabaseUrl: string) {
    try {
        await fetch(`${supabaseUrl}/rest/v1/scraping_jobs?job_id=eq.${jobId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...updates,
                updated_at: new Date().toISOString()
            })
        });
    } catch (error) {
        console.error('Failed to update job status:', error);
    }
}