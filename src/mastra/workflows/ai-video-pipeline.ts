import { ComfyUIApiClient } from '@stable-canvas/comfyui-client';

async function testComfyUI() {
    console.log('🚀 Testing ComfyUI Connection...\n');

    try {
        // Create client
        const client = new ComfyUIApiClient({
            api_host: '127.0.0.1',
            api_port: 8000,
            use_https: false
        });

        // Test 1: Basic connection
        console.log('1️⃣ Testing basic connection...');
        const queue = await client.getQueue();
        console.log('✅ Connected! Queue status:', queue);

        // Test 2: Get available nodes
        console.log('\n2️⃣ Testing available nodes...');
        const objectInfo = await client.getObjectInfo();
        console.log('✅ Found', Object.keys(objectInfo).length, 'node types');

        // Test 3: Get models
        console.log('\n3️⃣ Testing available models...');
        const models = await client.getModels();
        console.log('✅ Checkpoints:', Object.keys(models.checkpoints || {}).length);
        console.log('✅ VAE models:', Object.keys(models.vae || {}).length);

        // Test 4: System stats
        console.log('\n4️⃣ Testing system stats...');
        try {
            const stats = await client.getSystemStats();
            console.log('✅ System stats:', stats);
        } catch (e) {
            console.log('⚠️ System stats not available (normal for some ComfyUI versions)');
        }

        console.log('\n🎉 All tests passed! ComfyUI is ready to use.');
        return true;

    } catch (error) {
        console.error('\n❌ Connection failed:', error.message);
        console.log('\n🔧 Make sure:');
        console.log('• ComfyUI is running on port 8000');
        console.log('• Try: http://127.0.0.1:8000 in browser');
        console.log('• ComfyUI started without errors');
        return false;
    }
}

// Run test
testComfyUI()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(console.error);