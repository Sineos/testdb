#!/bin/bash

# Check if an argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <klipper|katapult>"
  exit 1
fi

# Set the path based on the argument
if [ "$1" == "klipper" ]; then
  BUILD_PATH="klipper"
elif [ "$1" == "katapult" ]; then
  BUILD_PATH="katapult"
else
  echo "Invalid argument. Use 'klipper' or 'katapult'."
  exit 1
fi

# Change to the specified directory
cd "$BUILD_PATH" || { echo "Directory $BUILD_PATH does not exist"; exit 1; }

# Clean and configure the build environment
make clean
make distclean
make olddefconfig

# Build with verbose output
make V=1
