#!/bin/bash

# Define the images and their directories
declare -A projects
projects["c43t8/forrest-bank-demo:resolver"]="2d_resolver"
projects["c43t8/forrest-bank-demo:issuer"]="2d_issuer"
projects["c43t8/forrest-bank-demo:banking-app"]="forrest-bank"

# Iterate through each project and build images
for image in "${!projects[@]}"; do
    dir=${projects[$image]}

    echo "Building and pushing $image from directory: $dir"

    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        -t "$image" \
        --push \
        "$dir"

    if [ $? -ne 0 ]; then
        echo "Error building $image. Exiting."
        exit 1
    fi
done

echo "All images built and pushed successfully."
