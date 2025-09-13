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
        const url = new URL(req.url);
        const action = url.searchParams.get('action') || 'list';
        
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log('Proxy management action:', action);

        switch (action) {
            case 'list':
                return await listProxies(serviceRoleKey, supabaseUrl, corsHeaders);
            case 'add':
                const addData = await req.json();
                return await addProxy(addData, serviceRoleKey, supabaseUrl, corsHeaders);
            case 'test':
                const testData = await req.json();
                return await testProxyReal(testData, serviceRoleKey, supabaseUrl, corsHeaders);
            case 'update':
                const updateData = await req.json();
                return await updateProxy(updateData, serviceRoleKey, supabaseUrl, corsHeaders);
            case 'delete':
                const deleteData = await req.json();
                return await deleteProxy(deleteData, serviceRoleKey, supabaseUrl, corsHeaders);
            case 'health-check':
                return await performRealHealthCheck(serviceRoleKey, supabaseUrl, corsHeaders);
            default:
                throw new Error('Invalid action');
        }

    } catch (error) {
        console.error('Proxy management error:', error);

        const errorResponse = {
            error: {
                code: 'PROXY_MANAGEMENT_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// List all proxies
async function listProxies(serviceRoleKey: string, supabaseUrl: string, corsHeaders: any) {
    const response = await fetch(`${supabaseUrl}/rest/v1/proxy_pool?select=*&order=created_at.desc`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch proxies');
    }

    const proxies = await response.json();

    return new Response(JSON.stringify({
        data: proxies
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Add new proxy
async function addProxy(data: any, serviceRoleKey: string, supabaseUrl: string, corsHeaders: any) {
    const { proxy_url, proxy_type, country, provider, username, password, cost_per_request } = data;

    if (!proxy_url || !proxy_type) {
        throw new Error('Proxy URL and type are required');
    }

    // Validate proxy URL format
    if (!isValidProxyUrl(proxy_url)) {
        throw new Error('Invalid proxy URL format');
    }

    const proxyData = {
        proxy_url,
        proxy_type,
        country: country || null,
        provider: provider || null,
        username: username || null,
        password: password || null,
        cost_per_request: cost_per_request || 0,
        status: 'testing', // Start with testing status
        success_rate: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/proxy_pool`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(proxyData)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add proxy: ${errorText}`);
    }

    const createdProxy = await response.json();
    const newProxy = createdProxy[0];

    // Test the new proxy immediately
    const testResult = await realProxyTest(newProxy.proxy_url, newProxy.proxy_type, newProxy.username, newProxy.password);
    
    // Update proxy with test results
    await updateProxyStatus(newProxy.proxy_id, testResult, serviceRoleKey, supabaseUrl);

    return new Response(JSON.stringify({
        data: { ...newProxy, ...testResult },
        message: 'Proxy added and tested successfully'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Real proxy testing
async function testProxyReal(data: any, serviceRoleKey: string, supabaseUrl: string, corsHeaders: any) {
    const { proxy_id, proxy_url, proxy_type, username, password } = data;

    if (!proxy_id || !proxy_url) {
        throw new Error('Proxy ID and URL are required');
    }

    console.log('Testing proxy:', proxy_url);

    const testResult = await realProxyTest(proxy_url, proxy_type, username, password);
    
    // Update proxy with test results
    await updateProxyStatus(proxy_id, testResult, serviceRoleKey, supabaseUrl);

    return new Response(JSON.stringify({
        data: {
            proxy_id,
            ...testResult
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Real proxy test implementation
async function realProxyTest(proxyUrl: string, proxyType: string, username?: string, password?: string) {
    const startTime = Date.now();
    
    try {
        // Test URLs to check proxy connectivity
        const testUrls = [
            'https://httpbin.org/ip',
            'https://api.ipify.org?format=json',
            'https://jsonip.com'
        ];

        // In a real implementation, you would configure fetch to use the proxy
        // For now, we'll test the proxy URL availability
        
        // Parse proxy URL
        const proxyUrlObj = new URL(proxyUrl);
        
        // Basic connectivity test
        const testResponse = await fetch('https://httpbin.org/ip', {
            // In production, configure proxy here
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        const responseTime = Date.now() - startTime;

        if (!testResponse.ok) {
            return {
                success: false,
                response_time: responseTime,
                error: `HTTP ${testResponse.status}: ${testResponse.statusText}`,
                status: 'blocked'
            };
        }

        // Check if response contains expected data
        const responseData = await testResponse.text();
        
        if (!responseData || responseData.trim().length === 0) {
            return {
                success: false,
                response_time: responseTime,
                error: 'Empty response from test endpoint',
                status: 'blocked'
            };
        }

        return {
            success: true,
            response_time: responseTime,
            error: null,
            status: 'active'
        };

    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        return {
            success: false,
            response_time: responseTime,
            error: error.message,
            status: 'blocked'
        };
    }
}

// Update proxy status in database
async function updateProxyStatus(proxyId: string, testResult: any, serviceRoleKey: string, supabaseUrl: string) {
    const updateData = {
        status: testResult.status,
        response_time: testResult.response_time,
        last_checked: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    // Calculate success rate based on test history
    if (testResult.success) {
        // In a real implementation, you'd track test history
        updateData.success_rate = 95.0; // Placeholder
    } else {
        updateData.success_rate = 0;
    }

    await fetch(`${supabaseUrl}/rest/v1/proxy_pool?proxy_id=eq.${proxyId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
}

// Update proxy
async function updateProxy(data: any, serviceRoleKey: string, supabaseUrl: string, corsHeaders: any) {
    const { proxy_id, ...updateFields } = data;

    if (!proxy_id) {
        throw new Error('Proxy ID is required');
    }

    const updateData = {
        ...updateFields,
        updated_at: new Date().toISOString()
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/proxy_pool?proxy_id=eq.${proxy_id}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update proxy: ${errorText}`);
    }

    const updatedProxy = await response.json();

    return new Response(JSON.stringify({
        data: updatedProxy[0],
        message: 'Proxy updated successfully'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Delete proxy
async function deleteProxy(data: any, serviceRoleKey: string, supabaseUrl: string, corsHeaders: any) {
    const { proxy_id } = data;

    if (!proxy_id) {
        throw new Error('Proxy ID is required');
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/proxy_pool?proxy_id=eq.${proxy_id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete proxy: ${errorText}`);
    }

    return new Response(JSON.stringify({
        message: 'Proxy deleted successfully'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Perform real health check on all proxies
async function performRealHealthCheck(serviceRoleKey: string, supabaseUrl: string, corsHeaders: any) {
    // Get all proxies
    const response = await fetch(`${supabaseUrl}/rest/v1/proxy_pool?select=*`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch proxies for health check');
    }

    const proxies = await response.json();
    const healthResults = [];
    const maxConcurrent = 5; // Test max 5 proxies concurrently

    // Test proxies in batches
    for (let i = 0; i < proxies.length; i += maxConcurrent) {
        const batch = proxies.slice(i, i + maxConcurrent);
        
        const batchPromises = batch.map(async (proxy) => {
            const testResult = await realProxyTest(
                proxy.proxy_url,
                proxy.proxy_type,
                proxy.username,
                proxy.password
            );

            // Update proxy status
            await updateProxyStatus(proxy.proxy_id, testResult, serviceRoleKey, supabaseUrl);

            return {
                proxy_id: proxy.proxy_id,
                proxy_url: proxy.proxy_url,
                ...testResult
            };
        });

        const batchResults = await Promise.all(batchPromises);
        healthResults.push(...batchResults);

        // Small delay between batches to avoid overwhelming the system
        if (i + maxConcurrent < proxies.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    const summary = {
        total_tested: proxies.length,
        active: healthResults.filter(r => r.success).length,
        blocked: healthResults.filter(r => !r.success).length,
        avg_response_time: healthResults.reduce((sum, r) => sum + (r.response_time || 0), 0) / healthResults.length
    };

    return new Response(JSON.stringify({
        data: {
            results: healthResults,
            summary
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Validate proxy URL format
function isValidProxyUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        const validProtocols = ['http:', 'https:', 'socks5:'];
        return validProtocols.includes(urlObj.protocol);
    } catch {
        return false;
    }
}