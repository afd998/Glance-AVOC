#!/usr/bin/env node

/**
 * Faculty Image Cutout Processor
 * 
 * This script:
 * 1. Fetches all faculty from Supabase
 * 2. Downloads their kelloggdirectory_image_url images
 * 3. Removes backgrounds using @imgly/background-removal-node
 * 4. Uploads cutouts to Supabase 'cutout-images' bucket
 * 5. Updates faculty table with cutout_image URLs
 */

console.log('🔧 Starting script initialization...');

import { removeBackground } from '@imgly/background-removal-node';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath, pathToFileURL } from 'url';

console.log('✅ Modules imported successfully');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env.development') });

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.development');
  console.error('Required: REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('Current values:');
  console.error('  REACT_APP_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Processing configuration
const BATCH_SIZE = 5; // Process 5 images at a time to avoid overwhelming the system
const TIMEOUT_MS = 60000; // 60 second timeout per image
const TEMP_DIR = path.join(__dirname, 'temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Download image from URL
 */
async function downloadImage(imageUrl, filename) {
  console.log(`📥 Downloading: ${imageUrl}`);
  
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.buffer();
    const filepath = path.join(TEMP_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    
    return filepath;
  } catch (error) {
    console.error(`❌ Download failed for ${imageUrl}:`, error.message);
    return null;
  }
}

/**
 * Remove background from image
 */
async function processImageCutout(imagePath) {
  console.log(`✂️ Processing cutout: ${imagePath}`);
  
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Processing timeout')), TIMEOUT_MS);
    });
    
    // Convert path to proper file URL for cross-platform compatibility
    const fileUrl = pathToFileURL(imagePath).href;
    console.log(`🔗 Using file URL: ${fileUrl}`);
    
    // @imgly/background-removal-node returns a Blob
    const blob = await Promise.race([
      removeBackground(fileUrl),
      timeoutPromise
    ]);
    
    console.log(`✅ Cutout processed, size: ${blob.size} bytes`);
    return blob;
  } catch (error) {
    console.error(`❌ Background removal failed for ${imagePath}:`, error.message);
    return null;
  }
}

/**
 * Upload blob to Supabase storage
 */
async function uploadToSupabase(blob, facultyId, originalUrl) {
  try {
    // Generate filename from faculty ID
    const filename = `faculty-${facultyId}-cutout.png`;
    
    console.log(`☁️ Uploading to Supabase: ${filename}`);
    
    // First, let's check if the bucket exists
    console.log(`🔍 Checking if 'cutout-images' bucket exists...`);
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`❌ Error listing buckets:`, listError);
    } else {
      console.log(`📋 Available buckets:`, buckets.map(b => b.name));
      const bucketExists = buckets.some(bucket => bucket.name === 'cutout-images');
      console.log(`✅ cutout-images bucket exists: ${bucketExists}`);
      
      if (!bucketExists) {
        console.log(`🔧 Creating 'cutout-images' bucket...`);
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('cutout-images', {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg'],
          fileSizeLimit: 10485760 // 10MB
        });
        
        if (createError) {
          console.error(`❌ Failed to create bucket:`, createError);
          throw createError;
        } else {
          console.log(`✅ Created bucket successfully:`, newBucket);
        }
      }
    }
    
    // Convert blob to buffer for Supabase
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to cutout-images bucket  
    const { data, error } = await supabase.storage
      .from('cutout-images')
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: true // Overwrite if exists
      });
    
    if (error) {
      console.error(`❌ Upload error details:`, error);
      throw error;
    }
    
    console.log(`📦 Upload response:`, data);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('cutout-images')
      .getPublicUrl(filename);
    
    console.log(`✅ Uploaded successfully: ${urlData.publicUrl}`);
    
    // Test the URL to make sure it's accessible
    console.log(`🧪 Testing URL accessibility...`);
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      console.log(`🌐 URL test response: ${response.status} ${response.statusText}`);
    } catch (urlError) {
      console.warn(`⚠️ URL test failed:`, urlError.message);
    }
    
    return urlData.publicUrl;
  } catch (error) {
    console.error(`❌ Upload failed for faculty ${facultyId}:`, error.message);
    console.error(`❌ Full error:`, error);
    return null;
  }
}

/**
 * Update faculty table with cutout URL
 */
async function updateFacultyRecord(facultyId, cutoutUrl) {
  try {
    console.log(`📝 Updating faculty record ${facultyId}`);
    
    const { error } = await supabase
      .from('faculty')
      .update({ cutout_image: cutoutUrl })
      .eq('id', facultyId);
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Updated faculty record ${facultyId}`);
  } catch (error) {
    console.error(`❌ Failed to update faculty ${facultyId}:`, error.message);
  }
}

/**
 * Process a single faculty member
 */
async function processFacultyMember(faculty) {
  const { id, kelloggdirectory_name, kelloggdirectory_image_url } = faculty;
  
  console.log(`\n🎯 Processing: ${kelloggdirectory_name} (ID: ${id})`);
  
  if (!kelloggdirectory_image_url) {
    console.log(`⏭️ Skipping ${kelloggdirectory_name}: No image URL`);
    return { success: false, reason: 'No image URL' };
  }
  
  // Check if already processed
  if (faculty.cutout_image) {
    console.log(`⏭️ Skipping ${kelloggdirectory_name}: Already has cutout image`);
    return { success: false, reason: 'Already processed' };
  }
  
  try {
    // Step 1: Download original image
    const filename = `temp-${id}-${Date.now()}.jpg`;
    const imagePath = await downloadImage(kelloggdirectory_image_url, filename);
    
    if (!imagePath) {
      return { success: false, reason: 'Download failed' };
    }
    
    // Step 2: Process cutout
    const cutoutBlob = await processImageCutout(imagePath);
    
    if (!cutoutBlob) {
      // Clean up temp file
      fs.unlinkSync(imagePath);
      return { success: false, reason: 'Cutout processing failed' };
    }
    
    // Step 3: Upload to Supabase
    const cutoutUrl = await uploadToSupabase(cutoutBlob, id, kelloggdirectory_image_url);
    
    if (!cutoutUrl) {
      // Clean up temp file
      fs.unlinkSync(imagePath);
      return { success: false, reason: 'Upload failed' };
    }
    
    // Step 4: Update database
    await updateFacultyRecord(id, cutoutUrl);
    
    // Clean up temp file
    fs.unlinkSync(imagePath);
    
    console.log(`🎉 Successfully processed ${kelloggdirectory_name}`);
    return { success: true, cutoutUrl };
    
  } catch (error) {
    console.error(`💥 Unexpected error processing ${kelloggdirectory_name}:`, error);
    return { success: false, reason: error.message };
  }
}

/**
 * Process all faculty in batches
 */
async function processAllFaculty() {
  console.log('🚀 Starting faculty cutout processing...\n');
  console.log('📍 Environment check:');
  console.log('  Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
  console.log('  Service Key:', supabaseServiceKey ? 'Found' : 'Missing');
  console.log('');
  
  try {
    // Test Supabase connection
    console.log('🔌 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('faculty')
      .select('count', { count: 'exact', head: true });
      
    if (testError) {
      console.error('❌ Supabase connection failed:', testError);
      throw testError;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Fetch all faculty
    console.log('📋 Fetching faculty list...');
    const { data: faculty, error } = await supabase
      .from('faculty')
      .select('id, kelloggdirectory_name, kelloggdirectory_image_url, cutout_image')
      .order('kelloggdirectory_name');
    
    if (error) {
      console.error('❌ Supabase query error:', error);
      throw error;
    }
    
    if (!faculty) {
      throw new Error('No faculty data returned from Supabase');
    }
    
    console.log(`📊 Found ${faculty.length} faculty members\n`);
    
    // Filter faculty that need processing
    const needProcessing = faculty.filter(f => 
      f.kelloggdirectory_image_url && !f.cutout_image
    );
    
    console.log(`🎯 ${needProcessing.length} faculty need cutout processing\n`);
    
    if (needProcessing.length === 0) {
      console.log('✅ All faculty already have cutout images!');
      return;
    }
    
    // Process in batches
    const results = {
      total: needProcessing.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < needProcessing.length; i += BATCH_SIZE) {
      const batch = needProcessing.slice(i, i + BATCH_SIZE);
      console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(needProcessing.length / BATCH_SIZE)}`);
      
      const batchPromises = batch.map(processFacultyMember);
      const batchResults = await Promise.all(batchPromises);
      
      // Update results
      batchResults.forEach((result, index) => {
        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
                  results.errors.push({
          faculty: batch[index].kelloggdirectory_name,
          reason: result.reason
        });
        }
      });
      
      // Brief pause between batches
      if (i + BATCH_SIZE < needProcessing.length) {
        console.log('⏸️ Pausing 5 seconds between batches...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Final report
    console.log('\n📊 FINAL REPORT:');
    console.log(`✅ Successful: ${results.successful}/${results.total}`);
    console.log(`❌ Failed: ${results.failed}/${results.total}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Failures:');
      results.errors.forEach(error => {
        console.log(`   • ${error.faculty}: ${error.reason}`);
      });
    }
    
    console.log('\n🎉 Processing complete!');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

/**
 * Clean up temp directory
 */
function cleanup() {
  console.log('🧹 Cleaning up temp files...');
  try {
    if (fs.existsSync(TEMP_DIR)) {
      const files = fs.readdirSync(TEMP_DIR);
      files.forEach(file => {
        fs.unlinkSync(path.join(TEMP_DIR, file));
      });
      fs.rmdirSync(TEMP_DIR);
    }
  } catch (error) {
    console.warn('⚠️ Cleanup warning:', error.message);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️ Interrupted by user');
  cleanup();
  process.exit(0);
});

process.on('exit', cleanup);

console.log('🏁 Starting main execution...');

// Run the script
processAllFaculty().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
