require('dotenv').config();
const request = require('request');
const getUrls = require('get-urls');

async function onInstallation(bot, installer) {
    if (!installer) {
        return;
    }

    try {
        await bot.startPrivateConversation(installer);
        await bot.say('I am a bot that has just joined your team');
        await bot.say('You must now /invite me to a channel so that I can be of use!');
    } catch (err) {
        console.log(err);
    }
}

var config = {};

if (process.env.TOKEN || process.env.SLACK_TOKEN) {
    var customIntegration = require('./lib/custom_integrations');
    var token = (process.env.TOKEN) ? process.env.TOKEN : process.env.SLACK_TOKEN;
    var controller = customIntegration.configure(token, config, onInstallation);
} else if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.PORT) {
    var app = require('./lib/apps');
    var controller = app.configure(process.env.PORT, process.env.CLIENT_ID, process.env.CLIENT_SECRET, config, onInstallation);
} else {
    console.log('Error: set TOKEN or SLACK_TOKEN for single-team mode, or CLIENT_ID, CLIENT_SECRET, and PORT for multi-team mode.');
    process.exit(1);
}

controller.on('direct_message,mention,direct_mention', async function (bot, message) {
        var urls = Array.from(getUrls(message.text || ''));
        if (!urls.length) {
            return;
        }

        var theUrl = urls[0].split('|')[0].replace(/[<>]/g, '');

        if (!theUrl.startsWith("https://docs.google.com/") && !theUrl.startsWith("https://drive.google.com/")) {
            return;
        }

        request.get(
            {
              uri: theUrl,
              followAllRedirects: true
            },
            async (err, res, body) => {
              if (err) {
                console.log(err);
                return;
              }
              if (!res) {
                return;
              }

              const chain = (res.request && res.request._redirect && res.request._redirect.redirects) || [];
              var isViewOnly = body && body.includes("</div>View only</div>");
              var doesRedirectToLogin = chain.length && chain[0].redirectUri && chain[0].redirectUri.indexOf("accounts.google.com") != -1;
              if (doesRedirectToLogin || isViewOnly) {
                try {
                    await bot.reply(message, "That Google Drive link is private! Consider making it public so that others can view it.");
                    await bot.api.reactions.add({
                        timestamp: message.ts,
                        channel: message.channel,
                        name: 'closed_lock_with_key',
                    });
                } catch (replyErr) {
                    console.log(replyErr);
                }
              }
          }
      )
});
