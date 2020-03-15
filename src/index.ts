import { Client, MessageEmbed, TextChannel } from 'discord.js';
import { token, users } from './config';
import database from './database';

const Promoter = new Client({
  disableMentions: 'all',
});

Promoter.on('ready', () => {
  console.log('Ready to Promote Things!');
  database.defaults({}).write();
});

Promoter.on('message', async m => {
  if (m.content?.split(' ')[0] === 'promo') {
    const [_prefix, cmd, ...args] = m.content.split(' ');

    if (!users.includes(m.author?.id as string)) return;

    const server = database.get(m.guild?.id as string);
    const cid = server.get('channel').value();
    const channel = m.guild?.channels.resolve(cid) as TextChannel;

    switch (cmd) {
      case 'set_channel':
        database
          .set(`${m.guild?.id}`, {
            channel: args[0],
            promotions: [],
          })
          .write();
        m.channel?.send(`Set <#${args[0]}> as the Promotion Channel`);
        break;
      case 'add':
        const [uid, name, ...description] = args;
        let url, image;
        const urlRegex = /^(https?):\/\/[^\s$.?#].[^\s]*$/gm;
        if (urlRegex.test(description[0])) {
          url = description[0];
          description.shift();
        }
        if (urlRegex.test(description[0])) {
          image = description[0];
          description.shift();
        }
        const user = Promoter.users.resolve(uid);
        if (user) {
          const embed = new MessageEmbed()
            .setAuthor(user.tag, user.avatarURL() as string)
            .setTitle(name)
            .setDescription(description.join(' '))
            .setURL(url ?? '')
            .setImage(image ?? '')
            .setTimestamp();
          const msg = await channel.send(embed);
          server
            .get('promotions')
            .push({
              mid: msg.id,
              description: description.join(' '),
              image: image ?? '',
              uid,
              name,
              url: url ?? '',
            })
            .write();
        }
        break;
      case 'remove':
        const [mid, ...reason] = args;
        channel.messages.delete(mid, reason.join(' ')).then(() => {
          server
            .get('promotions')
            .remove({ mid })
            .write();
        });
        break;
      case 'update':
        const [mid1, key, ...update] = args;
        server
          .get('promotions')
          .find({ mid: mid1 })
          .update(key, _val => update.join(' '))
          .write();
        const msg = await channel.messages.fetch(mid1);
        if (msg) {
          const embed = msg.embeds[0];
          switch (key) {
            case 'description':
              embed.setDescription(update.join(' '));
              break;
            case 'name':
              embed.setTitle(update.join(' '));
              break;
            case 'image':
              embed.setImage(update.join(' '));
              break;
            case 'url':
              embed.setURL(update.join(' '));
              break;
          }
          msg.edit('', embed);
        }
        break;
      default:
        const embed = new MessageEmbed().setTitle('Help!').addFields([
          {
            name: 'set_channel',
            value: 'set_channel {channel id}',
          },
          {
            name: 'add',
            value: 'add {user id} {name} {link?} {image link?} {description}',
          },
          {
            name: 'remove',
            value: 'remove {message id} {reason?}',
          },
          {
            name: 'update',
            value:
              'update {message id} {name | url | image | description} {value}',
          },
        ]);
        m.channel?.send(embed);
        break;
    }
  }
});

Promoter.login(token);
