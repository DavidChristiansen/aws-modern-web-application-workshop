#!/usr/bin/env node

import cdk = require('@aws-cdk/core');
import 'source-map-support/register';
import { DynamoDbStack } from '../lib/dynamodb-stack';
import { NetworkStack } from '../lib/network-stack';
import { WebApplicationStack } from '../lib/web-application-stack';
import { DeveloperToolsStack } from "../lib/developer-tools-stack";
import { APIGatewayStack } from "../lib/api-gateway-stack";
import { EcrStack } from "../lib/ecr-stack";
import { EcsStack } from "../lib/ecs-stack";
import { CiCdStack } from "../lib/cicd-stack";
import { CognitoStack } from '../lib/cognito-stack';
import { KinesisFirehoseStack } from '../lib/kinesis-firehose-stack';

const app = new cdk.App();
// cdk.Tag.add(app, 'Purpose', 'ScalableWebAppsWorkshop');
const developerToolStack = new DeveloperToolsStack(app, 'MythicalMysfits-DeveloperTools');
new WebApplicationStack(app, "MythicalMysfits-WebApplication");
const networkStack = new NetworkStack(app, "MythicalMysfits-Network");
const ecrStack = new EcrStack(app, "MythicalMysfits-ECR");
const ecsStack = new EcsStack(app, "MythicalMysfits-ECS", {
  vpc: networkStack.vpc,
  ecrRepository: ecrStack.ecrRepository
});
new CiCdStack(app, "MythicalMysfits-CICD", {
  ecrRepository: ecrStack.ecrRepository,
  ecsService: ecsStack.ecsService.service,
  apiRepositoryArn: developerToolStack.apiRepository.repositoryArn
});
const dynamoDBStack = new DynamoDbStack(app, "MythicalMysfits-DynamoDB", {
  vpc: networkStack.vpc,
  fargateService: ecsStack.ecsService.service
});
const cognito = new CognitoStack(app, "MythicalMysfits-Cognito");
new APIGatewayStack(app, "MythicalMysfits-APIGateway", {
  userPoolId: cognito.userPool.userPoolId,
  loadBalancerArn: ecsStack.ecsService.loadBalancer.loadBalancerArn,
  loadBalancerDnsName: ecsStack.ecsService.loadBalancer.loadBalancerDnsName
});
new KinesisFirehoseStack(app, "MythicalMysfits-KinesisFirehose", {
  table: dynamoDBStack.table
});
app.synth();
