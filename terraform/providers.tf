terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Uncomment this block when you're ready to configure remote state
  # backend "s3" {
  #   bucket         = "pomodoro-terraform-state"
  #   key            = "terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-lock"
  # }
}

provider "aws" {
  region = var.aws_region
  
  # Use these tags for all resources that support them
  default_tags {
    tags = {
      Project     = "Pomodoro Timer"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  }
}