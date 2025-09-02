# Supabase Cron Job Setup for Panopto Checks

## 🎯 **What This Does:**
Automatically marks panopto checks as "missed" when they're 30+ minutes past their scheduled time.

## 📋 **Step-by-Step Setup:**

### **Step 1: Run the Function SQL**
1. Go to **SQL Editor** in your Supabase dashboard
2. Run the `mark_missed_panopto_checks.sql` file
3. This creates the function that will be called by the cron job

### **Step 2: Enable Supabase Cron**
1. Go to **Settings** → **Integrations**
2. Find **"Cron"** in the list
3. Click **"Enable"** to activate the Cron Postgres Module

### **Step 3: Create the Cron Job**
1. Go to **Database** → **Cron Jobs** (or **Integrations** → **Cron**)
2. Click **"Create a new job"**
3. Fill in the details:

**Job Details:**
- **Name**: `mark_missed_panopto_checks`
- **Description**: `Automatically mark overdue panopto checks as missed`

**Schedule:**
- **Frequency**: Every minute
- **Cron Expression**: `* * * * *` (runs every minute)

**Job Type:**
- **Type**: Database Function
- **Function**: `mark_missed_panopto_checks()`

**Settings:**
- **Timeout**: 30 seconds
- **Retry on failure**: Yes (optional)

### **Step 4: Test the Job**
1. Click **"Create job"**
2. The job will start running automatically
3. Check the **Job History** tab to see if it's working
4. Look for logs showing "Marked check X as missed"

## 🔍 **Monitoring:**

### **Check Job Status:**
- Go to **Database** → **Cron Jobs**
- View **Job History** to see execution logs
- Check **Logs Explorer** for detailed logs

### **Verify Function Works:**
```sql
-- Test the function manually
SELECT mark_missed_panopto_checks();

-- Check for missed checks
SELECT * FROM panopto_checks WHERE status = 'missed';
```

## ⚠️ **Important Notes:**

- **Runs every minute** - checks for checks that are 30+ minutes past due
- **Only processes today's events** - won't affect past or future dates
- **Logs all actions** - you can see exactly what was marked as missed
- **Safe to run multiple times** - won't double-mark already missed checks

## 🎉 **Result:**
Once set up, your panopto checks will automatically be marked as "missed" when they're 30+ minutes overdue, and the frontend will show the proper status!
