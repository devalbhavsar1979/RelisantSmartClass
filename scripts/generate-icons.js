#!/usr/bin/env node

/**
 * Icon Generation Script for PWA
 * Generates 192x192 and 512x512 icons from source image
 * 
 * Usage: node scripts/generate-icons.js
 * 
 * Prerequisites:
 * npm install sharp
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sourceImage = path.join(__dirname, '../src/components/images/RelisantSmartClass.png')
const iconsDir = path.join(__dirname, '../public/icons')

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
  console.log(`✓ Created directory: ${iconsDir}`)
}

async function generateIcons() {
  try {
    // Check if source image exists
    if (!fs.existsSync(sourceImage)) {
      console.error(`✗ Error: Source image not found at ${sourceImage}`)
      console.error('Please ensure RelisantSmartClass.png exists in src/components/images/')
      process.exit(1)
    }

    console.log('📦 Generating PWA icons...\n')

    // Generate 192x192 icon
    console.log('Generating 192x192 icon...')
    await sharp(sourceImage)
      .resize(192, 192, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(iconsDir, 'icon-192x192.png'))
    console.log('✓ Generated: public/icons/icon-192x192.png')

    // Generate 512x512 icon
    console.log('Generating 512x512 icon...')
    await sharp(sourceImage)
      .resize(512, 512, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(iconsDir, 'icon-512x512.png'))
    console.log('✓ Generated: public/icons/icon-512x512.png')

    console.log('\n✓ All icons generated successfully!')
    console.log('\nNext steps:')
    console.log('1. Run: npm run build')
    console.log('2. Deploy your PWA')
    console.log('3. Open on Android/iOS to install')
  } catch (error) {
    console.error('✗ Error generating icons:', error.message)
    process.exit(1)
  }
}

generateIcons()
