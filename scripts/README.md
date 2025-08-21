# Faculty Cutout Processing Script

This script processes all faculty images to create background-removed cutouts and stores them in Supabase.

## Prerequisites

1. **Supabase Setup**:
   - Create a bucket called `cutout-images` in Supabase Storage
   - Add a column `cutout_image` (text) to the `faculty` table
   - Make sure you have `SUPABASE_SERVICE_ROLE_KEY` in your `.env.development`

2. **Environment Variables** (in parent `.env.development`):
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Installation

```bash
# Navigate to scripts directory
cd scripts

# Install dependencies
npm install
```

## Usage

```bash
# Run the processing script
npm run process-cutouts

# Or directly with node
node process-faculty-cutouts.js
```

## What It Does

1. ✅ Fetches all faculty from Supabase
2. ✅ Downloads their `kelloggdirectory_image_url` images
3. ✅ Removes backgrounds using AI (`@imgly/background-removal`)
4. ✅ Uploads cutouts to `cutout-images` bucket
5. ✅ Updates `faculty.cutout_image` with new URLs
6. ✅ Processes in batches to avoid overwhelming the system

## Features

- **Batch Processing**: Processes 5 images at a time
- **Resume Support**: Skips faculty who already have cutout images
- **Error Handling**: Continues processing even if individual images fail
- **Progress Reporting**: Shows detailed progress and final report
- **Timeout Protection**: 60-second timeout per image
- **Cleanup**: Removes temporary files automatically

## Output

The script will show progress like this:

```
🚀 Starting faculty cutout processing...

📋 Fetching faculty list...
📊 Found 150 faculty members

🎯 120 faculty need cutout processing

📦 Processing batch 1/24
🎯 Processing: John Smith (ID: 123)
📥 Downloading: https://kellogg.northwestern.edu/...
✂️ Processing cutout: temp-123-1234567890.jpg
✅ Cutout processed, size: 245678 bytes
☁️ Uploading to Supabase: faculty-123-cutout.png
✅ Uploaded successfully: https://supabase.../faculty-123-cutout.png
📝 Updating faculty record 123
✅ Updated faculty record 123
🎉 Successfully processed John Smith

📊 FINAL REPORT:
✅ Successful: 118/120
❌ Failed: 2/120

🎉 Processing complete!
```

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**:
   ```
   ❌ Missing Supabase configuration in .env.development
   ```
   - Make sure `.env.development` is in the parent directory
   - Check that both `REACT_APP_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

2. **Supabase Bucket Not Found**:
   ```
   ❌ Upload failed: Bucket 'cutout-images' not found
   ```
   - Create the `cutout-images` bucket in Supabase Storage
   - Make sure it's set to public access for the generated URLs

3. **Processing Timeout**:
   ```
   ❌ Background removal failed: Processing timeout
   ```
   - Some images may be too large or complex
   - These will be skipped and reported in the final summary

4. **Memory Issues**:
   - If you get out-of-memory errors, reduce `BATCH_SIZE` in the script
   - The AI model requires significant memory

### Performance Notes

- **First Run**: Downloads ~50MB AI model, may take 2-5 minutes to start
- **Processing Time**: ~30-60 seconds per image
- **Total Time**: For 100 faculty, expect 1-2 hours
- **Memory Usage**: Peak ~2GB RAM during processing

## After Running

Once complete, update your React app to use the cutout images:

1. Switch back to AI mode: `USE_AI_BACKGROUND_REMOVAL: false`
2. Update the component to use `faculty.cutout_image` instead of processing images

The cutout images will be instantly available with no processing delay!
