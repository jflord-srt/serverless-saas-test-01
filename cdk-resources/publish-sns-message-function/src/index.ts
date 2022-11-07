import {CloudFormationCustomResourceEvent} from 'aws-lambda';
import {SNS} from 'aws-sdk';

const sns = new SNS();

export const handler = async (event: CloudFormationCustomResourceEvent) => {
    console.log(`EventType: ${event.RequestType}`);
    console.log(JSON.stringify(event.ResourceProperties));

    const topicArn = event.ResourceProperties.topicArn;
    const subject = event.ResourceProperties.subject;
    const payload = event.ResourceProperties.payload;

    switch (event.RequestType) {
        case 'Create':
        case 'Update': {
            if (!topicArn) {
                throw new Error(
                    "Missing required resource property 'topicArn'"
                );
            }
            if (!subject) {
                throw new Error("Missing required resource property 'subject'");
            }
            if (!payload) {
                throw new Error("Missing required resource property 'payload'");
            }

            const params: SNS.PublishInput = {
                Subject: subject,
                Message: JSON.stringify(payload),
                TopicArn: topicArn,
            };

            console.log(
                `Publishing SNS message '${subject}' to topic '${topicArn}'`
            );
            return await sns.publish(params).promise();
        }
        case 'Delete': {
            console.log('Delete');
            return;
        }
        default: {
            throw new Error('Unknown request type');
        }
    }
};
