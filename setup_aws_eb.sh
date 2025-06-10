#!/bin/bash
set -e

# Load .env file if exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "Starting AWS Elastic Beanstalk setup..."

# Variables from .env or environment
AWS_REGION=${AWS_REGION:-us-east-1}
EB_APP_NAME=${EB_APP_NAME:-solicitor-client-mgmt}
EB_ENV_NAME=${EB_ENV_NAME:-solicitor-env}
DOCKER_IMAGE_NAME=${DOCKER_IMAGE_NAME:-yourdockerhubuser/solicitor-client-mgmt:latest}

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf awscliv2.zip aws/
else
    echo "AWS CLI already installed."
fi

# Check EB CLI
if ! command -v eb &> /dev/null; then
    echo "Installing EB CLI..."
    pip install --user awsebcli
else
    echo "EB CLI already installed."
fi

# AWS CLI configure only if env vars not set
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "Please configure AWS CLI with credentials."
  aws configure
fi

echo "Logging into Docker Hub..."
docker login

echo "Building Docker image..."
docker build -t $DOCKER_IMAGE_NAME .

echo "Pushing Docker image..."
docker push $DOCKER_IMAGE_NAME

echo "Initializing Elastic Beanstalk app..."
eb init $EB_APP_NAME --platform docker --region $AWS_REGION --verbose

echo "Creating environment $EB_ENV_NAME (if needed)..."
eb create $EB_ENV_NAME --single --verbose || echo "Environment exists."

echo "Setting environment variables on EB..."
eb setenv NODE_ENV=production JWT_SECRET=$JWT_SECRET DATABASE_URL=$DATABASE_URL

echo "Deploying to Elastic Beanstalk..."
eb deploy $EB_ENV_NAME

echo "AWS Elastic Beanstalk deployment complete!"

