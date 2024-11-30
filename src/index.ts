import puppeteer from "puppeteer-extra";
import { promisify } from "util";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { writeFileSync } from "fs";
import readline from 'node:readline';
// import { PageEvent } from "puppeteer";
const wait = promisify(setTimeout);

puppeteer.use(StealthPlugin());
puppeteer
  .launch({
    headless: false,
    args: ["--no-sandbox", '--use-fake-ui-for-media-stream','--start-maximized' ],
  })
  .then(async (browser) => {
    const page = await browser.pages().then((p) => p[0]);
    page.goto("https://hackclub.slack.com/");
    // request fullscreen on browser
    // browser. 
    // after login ...
    console.log(`Login to slack now..`);
    page.on('dialog', async dialog => {  

        console.log(dialog.message());  
  
        await dialog.dismiss();       
  
     })
   page.on("popup", async (popup) => {
    popup?.close()
   })
   browser.on('targetcreated', async (target) => {
    // Check if the target is a page (popup)
    if (target.type() === 'page') {
      const popup = await target.page();
      console.log(await page.url())
    if(await page.url() === "about:blank") {
      console.log('Popup detected, closing it...');
      await popup?.close();
    }
    }
  });

    let cookies_ok = false;
    try {
const cookies = require('../cookies.json');
        await page.setCookie(...cookies);
        console.log(`Cookies yay ${cookies}`);
        cookies_ok = true;
    } catch (e) {
        console.error(e, 'bad cookies');
        cookies_ok = false;
    } finally {
        if(!cookies_ok) {
            await page.waitForNavigation();
            await wait(200);
            await page.type('[data-qa="email_field"]', process.env.EMAIL!);
            await page.click('[aria-label="Sign In With Email"]');
            await page.waitForNavigation();
            await wait(200);
            console.log(`Enter the code from your email now.`);
            const code: string = await new Promise((r) =>
              process.stdin.once("data", (d) => r(d.toString().trim())),
            );
            for (let i = 0; i < code.length; i++) {
              try {
                await page.type(`[aria-label*="digit ${i + 1} of 6"]`, code[i]);
              } catch (e) {}
              await wait(10);
            }
    await wait(5_000);

        }
    }
    // await wait(500);
   
// dump cookies
   
    // 2s for redirect & 3s for allow being allowed
    await wait(5_00);
    // await page.click('[aria-label="Allow"]');
    // click the open browser button
    await page.goto(process.env.HUDDLE_CHANNEL_URL!)
    await wait(4500);
    const cookies = await page.cookies();
    writeFileSync('cookies.json', JSON.stringify(cookies, null, 2));
    await page.waitForSelector(".p-huddle_channel_header_button__container")
    // await page.click(".p-huddle_channel_header_button__container")
    await page.evaluate(() => {
        //@ts-ignore
        document.querySelector(".p-huddle_channel_header_button__container")?.children[1].click()
    })
    try {
        // if its already "in a huddle" just replace it
        await page.waitForSelector('[data-qa="huddle_multi_device_modal_switch_device"]', {
            timeout: 5000
        })
        await page.click('[data-qa="huddle_multi_device_modal_switch_device"]')
    } catch (e) {
        console.log(`Yay, im not in the huddle`)
    }
    await wait(2500)
    await page.waitForSelector('[data-qa="huddle_sidebar_footer_mute_button"]')
    await page.click('[data-qa="huddle_sidebar_footer_mute_button"]')
    await wait(50)
    // then document.querySelector('[data-qa="more_actions_menu"]').click()
    try {
await page.click('[data-qa="huddle_screen_share_button"]')
    } catch (e) {
        await page.click('[data-qa="more_actions_menu"]')
        await wait(150)
    await page.click('[data-qa="screen-share-v2"]')
    }

await wait(1000)
const the_share_page = await browser.newPage()

async function handleCmd(string: string, respond: (r: string) => void) {
    const args = string.split(' ')
    const cmd = args.shift()?.toLowerCase()
    if(cmd === 'goto') {
        the_share_page.goto(args[0])
    }
    if(cmd == "click") {
        try {
            the_share_page.waitForSelector(args.join(" "), { timeout: 1000 })
            the_share_page.click(args.join(" "))
        } catch (e: any) {
            respond(e.toString())
        }
    }
    if(cmd == "checkforel") {
        the_share_page.waitForSelector(args[0], { timeout: 1000 }).then(() => {
            respond('true')
        }).catch(() => {
            respond('false')
        })
    }
    if(cmd == "yt") {
        the_share_page.goto(`https://www.youtube-nocookie.com/embed/${args[0]}?autoplay=1`)
        await the_share_page.waitForNavigation();
      //   try {
      //     the_share_page.waitForSelector("body", { timeout: 1000 })
      //     the_share_page.click("body")
      // } catch (e: any) {
      //     respond(e.toString())
      // }
    }
    if(cmd == "clickxy") {
        the_share_page.mouse.click(parseInt(args[0]), parseInt(args[1]))
    }
    if(cmd == "type") {
        the_share_page.keyboard.type(args.join(" "))
    }
}

    if(process.env.CMD_HANDLER === "slack_bot") {
        // todo cuz i hate slacks api
    } else if (process.env.CMD_HANDLER == 'ws') {
       // todo: connect to ws
// on cmd to that cmd 
    } else if(process.env.CMD_HANDLER === "terminal") {
        // start repl thing
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '> ',
          });
          
          // Initialize an empty context to store variables and functions
          const context = {};
          
          rl.prompt();
          
          // Handle user input
          rl.on('line', async (input) => {
            try {
              if (input.trim() === 'exit') {
                console.log('Exiting REPL...');
                rl.close();
                return;
              }
          
              // Use eval to evaluate the user's input in the context of the REPL
            //   const result = eval(input);
          
              // Print the result of the evaluated expression
            //   console.log(input);
              await handleCmd(input, console.log)
              // Show the prompt again
              rl.prompt();
            } catch (error: any) {
              console.error('Error:', error.message);
              rl.prompt();
            }
          });
          
          rl.on('close', async () => {
     console.debug(`#close`)
     the_share_page.close()
await    page.bringToFront()
await page.click('[data-qa="huddle_mini_player_leave_button"]')
await wait(1_000)
process.exit(0)
          });
    }


//  
// document.querySelector('[data-qa="screen-share-v2"]').click()

})
process.on("unhandledRejection", (e) => {
  console.error(e);
})
process.on("uncaughtException", (e) => {
  console.error(e);
})