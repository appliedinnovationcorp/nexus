#!/bin/bash

# Fix script for TypeScript errors in domain core

DOMAIN_CORE_PATH="/home/oss/Business/workspaces/nexus-278-workspace/packages/domain/core/src"

echo "Fixing TypeScript errors in domain core..."

# Fix value object access issues - replace .value with .getValue()
find "$DOMAIN_CORE_PATH/entities" -name "*.ts" -exec sed -i 's/\.value\b/.getValue()/g' {} \;

# Fix constructor access issues - replace new ClassName() with ClassName.fromString()
find "$DOMAIN_CORE_PATH/entities" -name "*.ts" -exec sed -i 's/new IndustryVertical(/IndustryVertical.fromString(/g' {} \;
find "$DOMAIN_CORE_PATH/entities" -name "*.ts" -exec sed -i 's/new AIMaturityLevel(/AIMaturityLevel.fromString(/g' {} \;
find "$DOMAIN_CORE_PATH/entities" -name "*.ts" -exec sed -i 's/new ModelType(/ModelType.fromString(/g' {} \;
find "$DOMAIN_CORE_PATH/entities" -name "*.ts" -exec sed -i 's/new TicketPriority(/TicketPriority.fromString(/g' {} \;
find "$DOMAIN_CORE_PATH/entities" -name "*.ts" -exec sed -i 's/new TicketCategory(/TicketCategory.fromString(/g' {} \;

echo "Fixed value object access and constructor issues"

# Fix undefined/null safety issues by adding null checks
echo "Manual fixes still needed for:"
echo "1. Optional property assignments"
echo "2. Null/undefined checks"
echo "3. Type mismatches"
echo "4. Missing business rule methods"

echo "Running type check to see remaining errors..."
