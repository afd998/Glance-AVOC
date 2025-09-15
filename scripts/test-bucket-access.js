import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env.development');
console.log(`📁 Loading environment from: ${envPath}`);
dotenv.config({ path: envPath });

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.development');
  console.log('Required: REACT_APP_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBucketAccess() {
  console.log('🧪 Testing bucket access...\n');
  
  try {
    // 1. List buckets
    console.log('1️⃣ Listing all buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) throw bucketsError;
    
    console.log('📦 Available buckets:', buckets.map(b => `${b.name} (${b.public ? 'public' : 'private'})`));
    
    // 2. Check if cutout-images bucket exists and is public
    const cutoutBucket = buckets.find(b => b.name === 'cutout-images');
    if (!cutoutBucket) {
      console.log('❌ cutout-images bucket not found!');
      return;
    }
    
    console.log(`✅ cutout-images bucket found: ${cutoutBucket.public ? 'PUBLIC' : 'PRIVATE'}`);
    
    if (!cutoutBucket.public) {
      console.log('⚠️ WARNING: Bucket is PRIVATE - this is why you get 404 errors!');
      console.log('🔧 Fix: Go to Supabase Dashboard → Storage → Buckets → cutout-images → Settings → Enable "Public bucket"');
    }
    
    // 3. List files in cutout-images bucket
    console.log('\n2️⃣ Listing files in cutout-images bucket...');
    const { data: files, error: filesError } = await supabase.storage
      .from('cutout-images')
      .list();
    
    if (filesError) throw filesError;
    
    console.log(`📄 Found ${files.length} files:`);
    files.slice(0, 5).forEach(file => {
      console.log(`  - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
    });
    
    if (files.length > 5) {
      console.log(`  ... and ${files.length - 5} more files`);
    }
    
    // 4. Test public URL access
    if (files.length > 0) {
      console.log('\n3️⃣ Testing public URL access...');
      const testFile = files[0];
      const { data: urlData } = supabase.storage
        .from('cutout-images')
        .getPublicUrl(testFile.name);
      
      console.log(`🔗 Test URL: ${urlData.publicUrl}`);
      
      // Try to fetch the URL
      try {
        const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
        console.log(`📡 URL Response: ${response.status} ${response.statusText}`);
        
        if (response.status === 200) {
          console.log('✅ Public access works!');
        } else if (response.status === 404) {
          console.log('❌ 404 - Bucket is not public or RLS policy missing');
        }
      } catch (fetchError) {
        console.log('❌ Fetch failed:', fetchError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBucketAccess();
