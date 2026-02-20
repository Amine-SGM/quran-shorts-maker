// Test script to verify audio download fix
// Run with: npx ts-node tests/verify_audio_download.ts

import { getAudioUrlsForChapter, getReciters } from '../desktop/src/services/quran-api';
import { getAudioFile } from '../desktop/src/services/audio-cache';
import * as fs from 'fs';

async function testAudioDownload() {
    console.log('🧪 Testing audio download fix...\n');

    try {
        // 1. Test getReciters
        console.log('1️⃣ Fetching reciters...');
        const reciters = await getReciters('en');
        console.log(`✅ Found ${reciters.length} reciters`);
        console.log(`   First reciter: ${reciters[0].name} (ID: ${reciters[0].id})\n`);

        // 2. Test getAudioUrlsForChapter
        const testReciterId = '2'; // AbdulBaset AbdulSamad - Murattal
        const testChapter = 1; // Al-Fatiha

        console.log(`2️⃣ Fetching audio URLs for reciter ${testReciterId}, chapter ${testChapter}...`);
        const audioUrlMap = await getAudioUrlsForChapter(testReciterId, testChapter);
        console.log(`✅ Retrieved ${audioUrlMap.size} audio URLs`);

        // Show first few URLs
        const entries = Array.from(audioUrlMap.entries()).slice(0, 3);
        entries.forEach(([verseKey, url]) => {
            console.log(`   ${verseKey} → ${url}`);
        });
        console.log('');

        // 3. Verify URL is accessible (HEAD request)
        const firstUrl = audioUrlMap.get('1:1');
        if (!firstUrl) {
            throw new Error('No URL found for verse 1:1');
        }

        console.log('3️⃣ Verifying URL is accessible...');
        const headResponse = await fetch(firstUrl, { method: 'HEAD' });
        if (!headResponse.ok) {
            throw new Error(`URL not accessible: ${headResponse.status} ${headResponse.statusText}`);
        }
        console.log(`✅ URL is accessible (${headResponse.status})\n`);

        // 4. Test actual download
        console.log('4️⃣ Testing audio file download...');
        const audioPath = await getAudioFile('2', 1, 1, firstUrl);

        if (!fs.existsSync(audioPath)) {
            throw new Error('Downloaded file does not exist');
        }

        const stats = fs.statSync(audioPath);
        console.log(`✅ Audio file downloaded successfully`);
        console.log(`   Path: ${audioPath}`);
        console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB\n`);

        console.log('🎉 All tests passed! Audio download is working correctly.\n');

    } catch (error) {
        console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

testAudioDownload();
