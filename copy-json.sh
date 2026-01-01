#!/bin/bash
echo "Copying media-library.json to out directory..."
cp public/media-library.json out/media-library.json
echo "Done! Verifying file exists:"
ls -la out/media-library.json
