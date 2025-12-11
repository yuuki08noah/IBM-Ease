# Terraform Cloud Integration Guide

This project is configured to use **Terraform Cloud (TFC)** for state management and remote execution.

## 1. Project Configuration

The project is configured to use the following Terraform Cloud organization:

- **Organization**: `ibm-ease`
- **Workspace**: `ibm-cloud-developer-studio-quickstart`

Configuration file: `infra/terraform/templates/versions.tf`

## 2. Authentication Setup

### A. Authenticate Local CLI with Terraform Cloud

To run Terraform commands locally that connect to TFC, you need to log in:

1. Run the login command:

    ```bash
    terraform login
    ```

2. Type `yes` when prompted.
3. A browser window will open. Log in to Terraform Cloud and generate a token.
4. Paste the token into your terminal.

### B. Configure IBM Cloud Credentials in Terraform Cloud

The actual infrastructure provisioning happens in Terraform Cloud (or via remote state). You must provide your IBM Cloud credentials to TFC as **Workspace Variables**.

1. Go to your [Terraform Cloud Organization](https://app.terraform.io/app/ibm-ease).
2. Select the workspace: `ibm-cloud-developer-studio-quickstart` (if it doesn't exist, create it manually or run `terraform init` to let Terraform create it).
3. Go to **Variables**.
4. Add a new **Terraform Variable** (not Environment Variable, unless you are using `IBMCLOUD_API_KEY` env var logic, but we configured a variable):
    - **Key**: `ibmcloud_api_key`
    - **Value**: *Your Actual IBM Cloud API Key*
    - **Sensitive**: [x] Checked (Important!)
5. (Optional) Setup other variables if needed:
    - `region`: Default is `us-south`. You can override it here.

## 3. Running Deployment

Once authenticated and configured:

```bash
cd infra/terraform/templates
terraform init
terraform plan
terraform apply
```
