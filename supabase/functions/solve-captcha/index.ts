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
        const { captcha_type, image_url, site_key, job_id, solver_service } = await req.json();

        if (!captcha_type) {
            throw new Error('Captcha type is required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const twoCaptchaApiKey = Deno.env.get('TWOCAPTCHA_API_KEY');
        const antiCaptchaApiKey = Deno.env.get('ANTICAPTCHA_API_KEY');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log('Solving CAPTCHA:', { captcha_type, solver_service });

        let result;
        const startTime = Date.now();

        // Choose solver service
        if (solver_service === '2captcha' && twoCaptchaApiKey) {
            result = await solve2CaptchaReal(captcha_type, image_url, site_key, twoCaptchaApiKey);
        } else if (solver_service === 'anticaptcha' && antiCaptchaApiKey) {
            result = await solveAntiCaptchaReal(captcha_type, image_url, site_key, antiCaptchaApiKey);
        } else {
            throw new Error('No valid CAPTCHA solver API key available');
        }

        const solveTime = Date.now() - startTime;

        // Log CAPTCHA solve attempt
        const logData = {
            captcha_type,
            image_url: image_url || null,
            solution: result.solution,
            solver_service: solver_service || 'unknown',
            cost: result.cost,
            solve_time: solveTime,
            success: result.success,
            job_id: job_id || null,
            created_at: new Date().toISOString()
        };

        await fetch(`${supabaseUrl}/rest/v1/captcha_logs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(logData)
        });

        return new Response(JSON.stringify({
            data: {
                success: result.success,
                solution: result.solution,
                cost: result.cost,
                solve_time: solveTime,
                solver_service: solver_service
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('CAPTCHA solving error:', error);

        const errorResponse = {
            error: {
                code: 'CAPTCHA_SOLVE_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Real 2captcha implementation
async function solve2CaptchaReal(captchaType: string, imageUrl?: string, siteKey?: string, apiKey?: string) {
    console.log('Using 2captcha service for:', captchaType);
    
    if (!apiKey) {
        throw new Error('2captcha API key not provided');
    }

    try {
        let taskId: string;
        
        // Submit CAPTCHA task
        switch (captchaType) {
            case 'recaptcha_v2':
                if (!siteKey) throw new Error('Site key required for reCAPTCHA v2');
                taskId = await submit2CaptchaTask({
                    method: 'userrecaptcha',
                    googlekey: siteKey,
                    pageurl: 'https://example.com'
                }, apiKey);
                break;
                
            case 'recaptcha_v3':
                if (!siteKey) throw new Error('Site key required for reCAPTCHA v3');
                taskId = await submit2CaptchaTask({
                    method: 'userrecaptcha',
                    googlekey: siteKey,
                    pageurl: 'https://example.com',
                    version: 'v3',
                    min_score: 0.3
                }, apiKey);
                break;
                
            case 'hcaptcha':
                if (!siteKey) throw new Error('Site key required for hCaptcha');
                taskId = await submit2CaptchaTask({
                    method: 'hcaptcha',
                    sitekey: siteKey,
                    pageurl: 'https://example.com'
                }, apiKey);
                break;
                
            case 'image_captcha':
                if (!imageUrl) throw new Error('Image URL required for image CAPTCHA');
                // Download image and convert to base64
                const imageBase64 = await downloadImageAsBase64(imageUrl);
                taskId = await submit2CaptchaTask({
                    method: 'base64',
                    body: imageBase64
                }, apiKey);
                break;
                
            default:
                throw new Error(`Unsupported CAPTCHA type: ${captchaType}`);
        }

        // Wait for solution
        const solution = await wait2CaptchaSolution(taskId, apiKey);
        
        return {
            success: true,
            solution: solution,
            cost: getCaptchaCost(captchaType, '2captcha')
        };
        
    } catch (error) {
        console.error('2captcha error:', error);
        return {
            success: false,
            solution: null,
            cost: 0.002, // Still charge for failed attempts
            error: error.message
        };
    }
}

// Submit task to 2captcha
async function submit2CaptchaTask(taskData: any, apiKey: string): Promise<string> {
    const formData = new URLSearchParams();
    formData.append('key', apiKey);
    
    for (const [key, value] of Object.entries(taskData)) {
        formData.append(key, String(value));
    }

    const response = await fetch('https://2captcha.com/in.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
    });

    const responseText = await response.text();
    
    if (!response.ok || !responseText.startsWith('OK|')) {
        throw new Error(`Failed to submit task: ${responseText}`);
    }

    return responseText.split('|')[1];
}

// Wait for 2captcha solution
async function wait2CaptchaSolution(taskId: string, apiKey: string): Promise<string> {
    const maxAttempts = 30; // 5 minutes max (10 second intervals)
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        const response = await fetch(`https://2captcha.com/res.php?key=${apiKey}&action=get&id=${taskId}`);
        const responseText = await response.text();
        
        if (responseText === 'CAPCHA_NOT_READY') {
            continue;
        }
        
        if (responseText.startsWith('OK|')) {
            return responseText.split('|')[1];
        }
        
        throw new Error(`Error getting solution: ${responseText}`);
    }
    
    throw new Error('Timeout waiting for CAPTCHA solution');
}

// Real AntiCaptcha implementation
async function solveAntiCaptchaReal(captchaType: string, imageUrl?: string, siteKey?: string, apiKey?: string) {
    console.log('Using AntiCaptcha service for:', captchaType);
    
    if (!apiKey) {
        throw new Error('AntiCaptcha API key not provided');
    }

    try {
        let taskData: any;
        
        // Prepare task data based on CAPTCHA type
        switch (captchaType) {
            case 'recaptcha_v2':
                if (!siteKey) throw new Error('Site key required for reCAPTCHA v2');
                taskData = {
                    type: 'NoCaptchaTaskProxyless',
                    websiteURL: 'https://example.com',
                    websiteKey: siteKey
                };
                break;
                
            case 'recaptcha_v3':
                if (!siteKey) throw new Error('Site key required for reCAPTCHA v3');
                taskData = {
                    type: 'RecaptchaV3TaskProxyless',
                    websiteURL: 'https://example.com',
                    websiteKey: siteKey,
                    minScore: 0.3
                };
                break;
                
            case 'hcaptcha':
                if (!siteKey) throw new Error('Site key required for hCaptcha');
                taskData = {
                    type: 'HCaptchaTaskProxyless',
                    websiteURL: 'https://example.com',
                    websiteKey: siteKey
                };
                break;
                
            case 'image_captcha':
                if (!imageUrl) throw new Error('Image URL required for image CAPTCHA');
                const imageBase64 = await downloadImageAsBase64(imageUrl);
                taskData = {
                    type: 'ImageToTextTask',
                    body: imageBase64
                };
                break;
                
            default:
                throw new Error(`Unsupported CAPTCHA type: ${captchaType}`);
        }

        // Create task
        const taskId = await createAntiCaptchaTask(taskData, apiKey);
        
        // Wait for solution
        const solution = await waitAntiCaptchaSolution(taskId, apiKey);
        
        return {
            success: true,
            solution: solution,
            cost: getCaptchaCost(captchaType, 'anticaptcha')
        };
        
    } catch (error) {
        console.error('AntiCaptcha error:', error);
        return {
            success: false,
            solution: null,
            cost: 0.002,
            error: error.message
        };
    }
}

// Create AntiCaptcha task
async function createAntiCaptchaTask(taskData: any, apiKey: string): Promise<number> {
    const response = await fetch('https://api.anti-captcha.com/createTask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            clientKey: apiKey,
            task: taskData
        })
    });

    const responseData = await response.json();
    
    if (!response.ok || responseData.errorId !== 0) {
        throw new Error(`Failed to create task: ${responseData.errorDescription || 'Unknown error'}`);
    }

    return responseData.taskId;
}

// Wait for AntiCaptcha solution
async function waitAntiCaptchaSolution(taskId: number, apiKey: string): Promise<string> {
    const maxAttempts = 30; // 5 minutes max
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        const response = await fetch('https://api.anti-captcha.com/getTaskResult', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                clientKey: apiKey,
                taskId: taskId
            })
        });

        const responseData = await response.json();
        
        if (responseData.errorId !== 0) {
            throw new Error(`Error getting solution: ${responseData.errorDescription}`);
        }
        
        if (responseData.status === 'processing') {
            continue;
        }
        
        if (responseData.status === 'ready') {
            return responseData.solution.gRecaptchaResponse || responseData.solution.text || responseData.solution.token;
        }
        
        throw new Error(`Unexpected status: ${responseData.status}`);
    }
    
    throw new Error('Timeout waiting for CAPTCHA solution');
}

// Download image and convert to base64
async function downloadImageAsBase64(imageUrl: string): Promise<string> {
    try {
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        return base64;
    } catch (error) {
        throw new Error(`Error downloading image: ${error.message}`);
    }
}

// Get CAPTCHA solving cost
function getCaptchaCost(captchaType: string, service: string): number {
    const costs = {
        '2captcha': {
            'recaptcha_v2': 0.002,
            'recaptcha_v3': 0.003,
            'hcaptcha': 0.002,
            'text_captcha': 0.001,
            'image_captcha': 0.001
        },
        'anticaptcha': {
            'recaptcha_v2': 0.0015,
            'recaptcha_v3': 0.0025,
            'hcaptcha': 0.0018,
            'text_captcha': 0.0008,
            'image_captcha': 0.0008
        }
    };

    return costs[service]?.[captchaType] || 0.002;
}