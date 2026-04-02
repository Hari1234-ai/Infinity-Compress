#!/usr/bin/env bash
# Install system-level dependencies required by cairosvg
apt-get install -y libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf-2.0-0 libffi-dev shared-mime-info 2>/dev/null || true

# Install Python dependencies
pip install -r requirements.txt
