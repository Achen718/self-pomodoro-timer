terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

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

  # Use profile only when AWS_ACCESS_KEY_ID environment variable is not set
  # This ensures profile is only used locally, not in GitHub Actions
  profile = can(env("AWS_ACCESS_KEY_ID")) ? null : "pomodoro"

  default_tags {
    tags = {
      Project     = "Pomodoro Timer"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  }
}
