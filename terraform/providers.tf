terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # S3 backend configuration for state
  backend "s3" {
    bucket         = "ac-pomodoro-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-lock"
  }
}

provider "aws" {
  region = var.aws_region

  # Profile line removed to allow GitHub Actions to use environment variables
  # For local development, use AWS_PROFILE=pomodoro environment variable

  default_tags {
    tags = {
      Project     = "Pomodoro Timer"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  }
}
