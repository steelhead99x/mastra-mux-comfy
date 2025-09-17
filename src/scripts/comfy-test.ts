async function testComfyUI() {
    console.log('🚀 Testing ComfyUI Connection...\n');

    const baseUrl = 'http://127.0.0.1:8000';

    try {
        // Test 1: Basic connection - check if server is running
        console.log('1️⃣ Testing if ComfyUI server is running...');
        const response = await fetch(`${baseUrl}/queue`);

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }

        const queueData = await response.json();
        console.log('✅ ComfyUI server is running!');
        console.log('📊 Queue status:', queueData);

        // Test 2: Get available nodes
        console.log('\n2️⃣ Getting available nodes...');
        const objectInfoResponse = await fetch(`${baseUrl}/object_info`);
        const objectInfo = await objectInfoResponse.json();
        console.log('✅ Found', Object.keys(objectInfo).length, 'node types');

        // Show some example nodes
        const nodeTypes = Object.keys(objectInfo).slice(0, 5);
        console.log('🔧 Example nodes:', nodeTypes);

        // Test 3: Get system info
        console.log('\n3️⃣ Getting system information...');
        try {
            const systemResponse = await fetch(`${baseUrl}/system_stats`);
            if (systemResponse.ok) {
                const systemStats = await systemResponse.json();
                console.log('✅ System stats:', systemStats);
            } else {
                console.log('⚠️ System stats endpoint not available');
            }
        } catch (e) {
            console.log('⚠️ System stats not supported by this ComfyUI version');
        }

        // Test 4: Check if we can get embeddings
        console.log('\n4️⃣ Checking embeddings...');
        try {
            const embeddingsResponse = await fetch(`${baseUrl}/embeddings`);
            if (embeddingsResponse.ok) {
                const embeddings = await embeddingsResponse.json();
                console.log('✅ Embeddings available:', Object.keys(embeddings).length);
            } else {
                console.log('⚠️ No embeddings endpoint');
            }
        } catch (e) {
            console.log('⚠️ Embeddings not available');
        }

        console.log('\n🎉 Connection test successful! ComfyUI is ready to use.');
        return true;

    } catch (error: any) {
        console.error('\n❌ Connection failed!');

        if (error.code === 'ECONNREFUSED') {
            console.log('🔧 ComfyUI server is not running or not accessible.');
            console.log('💡 Solutions:');
            console.log('   • Start ComfyUI server');
            console.log('   • Make sure it\'s running on port 8000');
            console.log('   • Check if another process is using port 8000');
        } else if (error.code === 'ENOTFOUND') {
            console.log('🔧 Cannot resolve hostname.');
            console.log('💡 Try using 127.0.0.1 instead of localhost');
        } else {
            console.log('🔧 Error details:', error.message);
        }

        console.log('\n📋 To start ComfyUI:');
        console.log('   python main.py');
        console.log('   or');
        console.log('   python main.py --listen');

        return false;
    }
}

// Simple test to check if port 8188 is accessible
async function checkPort() {
    console.log('🔍 Checking if port 8188 is accessible...');

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch('http://127.0.0.1:8000', {
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('✅ Port 8000 is accessible');
        return true;
    } catch (error: any) {
        console.log('❌ Port 8000 is not accessible');
        console.log('   Error:', error.message);
        return false;
    }
}

// Main execution
async function main() {
    // First check if the port is accessible
    const portAccessible = await checkPort();

    if (!portAccessible) {
        console.log('\n🚨 ComfyUI server is not running on port 8000');
        console.log('🔧 Please start ComfyUI first:');
        console.log('   cd /path/to/ComfyUI');
        console.log('   python main.py');
        process.exit(1);
    }

    // Run the full test
    const success = await testComfyUI();
    process.exit(success ? 0 : 1);
}

main().catch(console.error);