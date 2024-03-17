import OpenAI from 'openai';
import { sleep } from 'openai/core';

import { config } from 'dotenv';
config();

const openai = new OpenAI();

async function main() {
  let modelName;
  // latest model finding.. -> gpt-3.5-turbo-0125
  const modelList = await openai.models.list();
  for await (const model of modelList) {
    // console.log(model);

    if (model.id === 'gpt-4-0125-preview') {
      console.log('find!!');
      console.log(model.id);

      modelName = model.id;
      break;
    }
  }

  // console.log('process exit!');
  // process.exit(1);

  const assistant = await openai.beta.assistants.create({
    name: 'Math Tutor',
    instructions:
      'You are a personal math tutor. Write and run code to answer math questions.',
    tools: [{ type: 'code_interpreter' }],
    model: modelName,
  });

  let assistantId = assistant.id;
  console.log('Created Assistant with Id: ' + assistantId);

  // const thread = await openai.beta.threads.create();

  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: 'user',
        content:
          '"I need to solve the equation `3x + 11 = 14`. Can you help me?"',
      },
    ],
  });

  let threadId = thread.id;
  console.log('Created thread with Id: ' + threadId);

  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistantId,
    additional_instructions:
      'Please address the user as Jane Doe. The user has a premium account.',
  });

  console.log('Created run with Id: ' + run.id);

  while (true) {
    const result = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    if (result.status == 'completed') {
      const messages = await openai.beta.threads.messages.list(thread.id);
      for (const message of messages.getPaginatedItems()) {
        console.log(message);

        for (const content of message.content) {
          if (content.type === 'text') {
            console.log(content.text);
          } else {
            console.log('this is image. Sorry to show data for you!');
          }
        }
      }
      break;
    } else {
      console.log('Waiting for completion. Current status: ' + result.status);
      await sleep(5000);
    }
  }
}

main();
