# Baller Stats Stack
This is an aws cdk stack for extracting the baller stats data from a publicly accessible google sheet. To deploy, ensure you have the following environment variables set.

| name      | value |
| ----------- | ----------- |
| BS_SITE   | The url that will be allowed to retrieve the data. Used for CORS.  |
| BS_SHEET_ID   | The id of the public google sheet |
| BS_LEAGUE_LEADERS_SHEET   | The name of the google sheet where the league leaders (totals) is places  |

## Useful commands
* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
* `cdk deploy`      deploy this stack to your default AWS




## Services Diagram
![AWS Services](./images/aws-flow.jpg?raw=true "AWS Services")  

The cron schedule is set to run Tuesday and Thursday.