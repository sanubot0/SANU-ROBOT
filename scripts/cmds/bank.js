const fs = require("fs");
const fruitIcons = [
  "🍒", "🍊", "🍋", "🍇", "🍓", "🍍", "🥥", "🥑", "🧅", "🍆", "🍅", "🍋", "🍏", "🍐", "🥝", "🍎", "🍉", "🌽", "🍌", "🍑"
];

function getTopUsers(bankData, count) {
  const entries = Object.entries(bankData);
  return entries
    .sort((a, b) => b[1].bank - a[1].bank)
    .slice(0, count);
}

function getTotalMoney(topUsers) {
  let totalMoney = 0;
  for (const [userID, data] of topUsers) {
    totalMoney += data.bank;
  }
  return totalMoney;
}

function deductMoneyFromTopUsers(topUsers, amount) {
  const deductedUsers = [];
  for (const [userID, data] of topUsers) {
    if (amount <= 0) break;
    const deduction = Math.min(amount, data.bank);
    data.bank -= deduction;
    amount -= deduction;
    deductedUsers.push({
      userID,
      deduction,
    });
  }
  return deductedUsers;
}

module.exports = {
  config: {
    name: "bank",
    version: "2.31",
    author: "LiANE | ArYAN",
    countDown: 0,
    role: 0,
    longDescription: {
      en: "The bank command provides various banking services including games.",
    },
    category: "banking",
    guide: {
      en: "",
    },
  },

  onStart: async function ({ args, message, event, usersData, api }) {
    const { getPrefix } = global.utils;
    const p = getPrefix(event.threadID);
    const userMoney = await usersData.get(event.senderID, "money");
    const user = parseInt(event.senderID);
    const bankData = JSON.parse(fs.readFileSync("bank.json", "utf8"));
    const lianeBank = "🏦 𝗦𝘁𝗼𝗻𝗲 𝗕𝗮𝗻𝗸"; // Updated bank name
    const getUserInfo = async (api, userID) => {
      try {
        const name = await api.getUserInfo(userID);
        return name[userID].firstName;
      } catch (error) {
        console.error(error);
      }
    };

    let { messageID, threadID, senderID } = event;
    const userName = await getUserInfo(api, senderID);

    if (!bankData[user]) {
      bankData[user] = { bank: 0, lastInterestClaimed: Date.now(), loan: 0, loanDueDate: 0, transactions: [] }; // Added transactions array
      fs.writeFile("bank.json", JSON.stringify(bankData), (err) => {
        if (err) throw err;
      });
    }

    const command = args[0];
    const amount = parseInt(args[1]);
    const recipientUID = parseInt(args[2]);

    if (command === "richest") {
      let page = parseInt(args[1]);

      if (isNaN(page) || page <= 0) {
        page = 1; // Set the default page to 1 if not a valid number
      }

      const pageSize = 10;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      const entries = Object.entries(bankData);
      const totalEntries = entries.length;

      const topTen = entries
        .sort((a, b) => b[1].bank - a[1].bank)
        .slice(start, end);

      const messageText = `𝓣𝓸𝓹 𝟙𝟘 𝓡𝓲𝓬𝓱𝓮𝓼𝓽 👑🤴🏻 \n\n${(await Promise.all(
        topTen.map(async ([userID, data], index) => {
          const userData = await usersData.get(userID);
          return `
╭──────[ ${index + start + 1} ]──────╮
│ℹ️|𝗡𝗮𝗺𝗲
│➤ ${userData.name}
│💰|𝗕𝗮𝗻𝗮𝗻𝗰𝗲
│➤ ${data.bank}
╰──────────────╯
`;
        })
      )).join("\n\n")}`;

      const totalPages = Math.ceil(totalEntries / pageSize);
      const currentPage = Math.min(page, totalPages);

      const nextPage = currentPage + 1;
      const nextPageMessage = nextPage <= totalPages ? `⦿ Type bank richest ${nextPage} to view the next page.\n` : "";
      const pageInfo = `page ${currentPage}/${totalPages}`;

      return message.reply(`${messageText}\n\n${nextPageMessage}${pageInfo}`);
    } else if (command === "deposit") {
      if (isNaN(amount) || amount <= 0) {
        return message.reply(`${lianeBank}\n\n✧ Hello ${userName}! Please enter the amount you wish to deposit in the bank.\n\nMore Options:\n⦿ Balance`);
      }
      if (userMoney < amount) {
        return message.reply(`${lianeBank}\n\n✧ Hello ${userName}, The amount you wish is greater than your balance.\n\nMore Options:\n⦿ Balance`);
      }

      bankData[user].bank += amount;
      bankData[user].transactions.push({ type: 'Deposit', amount, timestamp: Date.now() }); // Added transaction record

      await usersData.set(event.senderID, {
        money: userMoney - amount,
      });

      fs.writeFile("bank.json", JSON.stringify(bankData), (err) => {
        if (err) throw err;
      });

      return message.reply(`${lianeBank}\n\n✧ Congratulations ${userName}! ${amount}💵 has been deposited into your bank account.\n\nMore Options:\n⦿ Balance\n⦿ Bank Balance\n⦿ Bank Interest\n⦿ Bank Transfer`);
    } else if (command === "withdraw") {
      const balance = bankData[user].bank || 0;

      if (isNaN(amount) || amount <= 0) {
        return message.reply(`${lianeBank}\n\n✧ Hello ${userName}! Please enter the amount you wish to withdraw from the bank.\n\nMore Options:\n⦿ Bank Balance\n⦿ Balance\n⦿ Bank Interest`);
      }
      if (amount > balance) {
        return message.reply(`${lianeBank}\n\n✧ Hello ${userName}, the amount you wish is greater than your bank balance.\n\nMore Options:\n⦿ Bank Balance`);
      }

      bankData[user].bank = balance - amount;
      const userMoney = await usersData.get(event.senderID, "money");
      await usersData.set(event.senderID, {
        money: userMoney + amount,
      });

      bankData[user].transactions.push({ type: 'Withdraw', amount, timestamp: Date.now() }); // Added transaction record

      fs.writeFile("bank.json", JSON.stringify(bankData), (err) => {
        if (err) throw err;
      });

      return message.reply(`${lianeBank}\n\n✧ Congratulations ${userName}! ${amount}💵 has been successfully withdrawn from your bank account. Use it wisely! \n\nMore Options:\n⦿ Balance\n⦿ Bank Balance`);
    } else if (command === "dice") {
      // Simulate rolling a dice with numbers from 1 to 6
      const userDice = Math.floor(Math.random() * 6) + 1;
      const lianeBotDice = Math.floor(Math.random() * 6) + 1;

      // Map dice roll results to their respective emojis
      const diceEmojis = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
      const userDiceEmoji = diceEmojis[userDice - 1];
      const lianeBotDiceEmoji = diceEmojis[lianeBotDice - 1];

      // Determine the outcome
      let outcomeMessage = `You rolled: ${userDiceEmoji}\nLiane Bot rolled: ${lianeBotDiceEmoji}\n\n`;

      if (userDice > lianeBotDice) {
        const winnings = amount * 2;
        outcomeMessage += `Congratulations! You won ${winnings}💵 with a roll of ${userDice}.`;

        bankData[user].bank += winnings;
        bankData[user].transactions.push({ type: 'Dice Roll Win', amount: winnings, timestamp: Date.now() }); // Added transaction record
      } else if (userDice < lianeBotDice) {
        const loss = amount;
        outcomeMessage += `Liane Bot won ${loss}💵 with a roll of ${lianeBotDice}.`;

        bankData[user].bank -= loss;
        bankData[user].transactions.push({ type: 'Dice Roll Loss', amount: loss, timestamp: Date.now() }); // Added transaction record
      } else {
        outcomeMessage += `It's a tie! No money exchanged.`;
      }

      fs.writeFile("bank.json", JSON.stringify(bankData), (err) => {
        if (err) throw err;
      });

      return message.reply(`${lianeBank}\n\n✧ Let's roll the dice!\n\n${outcomeMessage}`);
    } else if (command === "slot") {
      // Check if a valid bet amount is specified
      const betAmount = parseInt(args[1]);
      if (isNaN(betAmount) || betAmount <= 0) {
        return message.reply(`${lianeBank}\n\n✧ Please enter a valid bet amount. You need to withdraw your bank balance first to use your bank balance as the bet.`);
      }

      // Check if the user has enough balance for the bet
      if (userMoney < betAmount) {
        return message.reply(`${lianeBank}\n\n✧ You don't have enough balance for this bet. Try to withdraw your bank balance.`);
      }

      // Randomly select three fruit icons
      const slotResults = [];
      for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * fruitIcons.length);
        slotResults.push(fruitIcons[randomIndex]);
      }

      // Check for winning combinations
      let winnings = 0;
      if (slotResults[0] === slotResults[1] && slotResults[1] === slotResults[2]) {
        // All three fruits are the same
        winnings = betAmount * 10;
      } else if (slotResults[0] === slotResults[1] || slotResults[1] === slotResults[2] || slotResults[0] === slotResults[2]) {
        // Two fruits are the same
        winnings = betAmount * 5;
      }

      // Update the user's balance
      if (winnings > 0) {
        await usersData.set(event.senderID, {
          money: userMoney + winnings,
        });
      } else {
        await usersData.set(event.senderID, {
          money: userMoney - betAmount,
        });
      }

      // Generate the response message with fruit icons
      const slotResultText = slotResults.join(" ");
      const outcomeMessage = winnings > 0 ? `Congratulations! You won ${winnings}💵.` : `You lost ${betAmount}💵.`;
      const responseMessage = `${lianeBank}\n\n ${slotResultText}\n\n✧ ${outcomeMessage}`;

      return message.reply(responseMessage);
    } else if (command === "heist") {
      // Check if the user has completed the heist tutorial
      if (bankData[user].heistTutorial !== true) {
        return message.reply(`${lianeBank}\n\n✧ Hello ${userName}! Before attempting a bank heist, please complete the heist tutorial first.\n\nMore Options:\n⦿ Bank Tutorial`);
      }

      const lastHeistTime = bankData[user].lastHeistTime || 0;
      const cooldown = 24 * 60 * 60 * 1000; // 24 hours cooldown
      const userMoney = await usersData.get(event.senderID, "money");

      if (args[1] === "confirm") {
        if (Date.now() - lastHeistTime < cooldown) {
          const remainingTime = cooldown - (Date.now() - lastHeistTime);
          const hours = Math.floor(remainingTime / (60 * 60 * 1000));
          const minutes = Math.ceil((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
          const userMoney = await usersData.get(event.senderID, "money");

          return message.reply(`${lianeBank}\n\n✧ Sorry ${userName}, you need to wait ${hours} hours and ${minutes} minutes before starting another heist.`);
        }

        // Calculate the amount to steal (random between 1000 and 5000)
        const amountToSteal = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;

        // Check if the user is successful in the heist
        const successRate = Math.random();
        if (successRate < 0.35) {
          // Failed heist
          const loanAmount = (bankData[user].bank + amountToSteal) * 0.1;
          const userMoney = await usersData.get(event.senderID, "money");

          bankData[user].loan += loanAmount;
          await usersData.set(event.senderID, {
            money: userMoney - loanAmount,
          });

          return message.reply(`${lianeBank}\n\n✧ Oops you got caught, ${userName}! Your bank heist was unsuccessful. You couldn't steal anything this time. However, 10% of the total heist amount has been added to your bank loan, ${loanAmount} has been deducted from your balance and bank balance`);
        }

        // Successful heist
        const topUsers = getTopUsers(bankData, 5);
        const totalMoneyToDeduct = Math.floor(Math.random() * (0.1 * getTotalMoney(topUsers)));
        const deductedUsers = deductMoneyFromTopUsers(topUsers, totalMoneyToDeduct);
        const winAmount = Math.floor(Math.random() * (0.1 * getTotalMoney(topUsers)));

        bankData[user].bank += amountToSteal;
        await usersData.set(event.senderID, {
          money: userMoney + winAmount,
        });
        bankData[user].lastHeistTime = Date.now();

        // Prepare a message about the deducted money from top users
        let deductedUsersMessage = "Money deducted from the top 1-5 users:\n";
        for (const { userID, deduction } of deductedUsers) {
          const deductedUserName = await getUserInfo(api, userID);
          deductedUsersMessage += `${deductedUserName}: ${deduction}💵\n`;
        }

        fs.writeFile("bank.json", JSON.stringify(bankData), (err) => {
          if (err) throw err;
        });

        return message.reply(`${lianeBank}\n\n✧ Congratulations, ${userName}! You successfully completed a bank heist and stole ${amountToSteal}💵. You also won ${winAmount}💵.\n\n${deductedUsersMessage}`);
      } else {
        // User wants to start a heist, provide information about the heist
        return message.reply(`${lianeBank}\n\n✧ Welcome, ${userName}! You are about to start a bank heist. Here's what you need to know:\n\n✧ If you win, you can steal a random amount between 1000 and 5000💵 from the bank, and you have a 35% chance of winning.\n\n✧ If you lose, 10% of the total heist amount will be added to your bank loan, regardless of the bank loan limit. There is a chance that you will lose all your cash and have negative cash! Proceed with caution. To confirm the heist, use the command "bank heist confirm".`);
      }

    } else if (command === "harvest") {
      const investmentAmount = parseInt(args[1]);

      if (isNaN(investmentAmount) || investmentAmount <= 0) {
        return message.reply(`${lianeBank}\n\n✧ Hello ${userName}! Please enter a valid investment amount.💸`);
      }

      const riskOutcome = Math.random() < 0.7;
      const potentialReturns = investmentAmount * (riskOutcome ? 2 : 0.2);

      if (riskOutcome) {
        bankData[user].bank -= investmentAmount;
        bankData[user].transactions.push({ type: 'Harvest Investment Loss', amount: investmentAmount, timestamp: Date.now() }); // Added transaction record
        fs.writeFileSync("bank.json", JSON.stringify(bankData));
        return message.reply(`${lianeBank}\n\n✧ Hello ${userName}! Your high-risk investment of ${investmentAmount}$ was risky, and you lost your money. `);
      } else {
        bankData[user].bank += potentialReturns;
        bankData[user].transactions.push({ type: 'Harvest Investment Return', amount: potentialReturns, timestamp: Date.now() }); // Added transaction record
        fs.writeFileSync("bank.json", JSON.stringify(bankData));
        return message.reply(`${lianeBank}\n\n✧ Hello ${userName}! Congratulations! Your high-risk investment of ${investmentAmount}$ paid off, and you earned ${potentialReturns}$ in returns! 🎉`);
      }
    } else if (command === "bet") {
      const betAmount = parseInt(args[1]);

      if (isNaN(betAmount) || betAmount <= 0) {
        return message.reply(`${lianeBank}\n\n✧ Hello ${userName}! Please enter a valid bet amount.💸`);
      }

      if (betAmount > bankData[user].bank) {
        return message.reply(`${lianeBank}\n\n✧ Sorry ${userName}, you don't have enough money in your bank account to place this bet.`);
      }

      const outcome = Math.random() < 0.5;

      if (outcome) {
        const winnings = betAmount * 2;
        bankData[user].bank += winnings;
        bankData[user].transactions.push({ type: 'Bet Win', amount: winnings, timestamp: Date.now() }); // Added transaction record
        fs.writeFileSync("bank.json", JSON.stringify(bankData));
        return message.reply(`${lianeBank}\n\n✧ Congratulations ${userName}! You won the bet!\n\n💲 Bet amount: ${betAmount}$\n\n💰 You won: ${winnings}$\n\n💰 New bank balance: ${bankData[user].bank}$`);
      } else {
        bankData[user].bank -= betAmount;
        bankData[user].transactions.push({ type: 'Bet Loss', amount: betAmount, timestamp: Date.now() }); // Added transaction record
        fs.writeFileSync("bank.json", JSON.stringify(bankData));
        return message.reply(`${lianeBank}\n\n✧ Better luck next time ${userName}! You lost the bet.\n\n💲 Bet amount: ${betAmount}$\n\n💰 New bank balance: ${bankData[user].bank}$`);
      }
    } else if (command === "coinflip") {
      const betAmount = parseInt(args[1]);
      const guess = args[2];

      if (isNaN(betAmount) || betAmount <= 0) {
        return message.reply(`${lianeBank}\n\n✧ Hello ${userName}! Please enter a valid bet amount.💸`);
      }

      if (betAmount > bankData[user].bank) {
        return message.reply(`${lianeBank}\n\n✧ Sorry ${userName}, you don't have enough money in your bank account to place this bet.`);
      }

      if (!guess || (guess !== "heads" && guess !== "tails")) {
        return message.reply(`${lianeBank}\n\n✧ Hello ${userName}! Please enter your guess as either "heads" or "tails".`);
      }
      const outcome = Math.random() < 0.5;
      const result = outcome ? "heads" : "tails";

      if (guess === result) {
        const winnings = betAmount * 2;
        bankData[user].bank += winnings;
      } else {
        bankData[user].bank -= betAmount;
      }

      bankData[user].transactions.push({ type: 'Coinflip', amount: betAmount, timestamp: Date.now() }); // Added transaction record
      fs.writeFileSync("bank.json", JSON.stringify(bankData));

      return message.reply(`${lianeBank}\n\n✧ Coin flip result: ${result}\n\n💲 Bet amount: ${betAmount}$\n\n💰 New bank balance: ${bankData[user].bank}$`);
    } else if (command === "roulette") {
      const betAmount = parseInt(args[1]);
      const betType = args[2];

      if (isNaN(betAmount) || betAmount <= 0) {
        return message.reply(`${lianeBank}\n\n✧ Hello ${userName}! Please enter a valid bet amount.💸`);
      }

      if (betAmount > bankData[user].bank) {
        return message.reply(`${lianeBank}\n\n✧ Sorry ${userName}, you don't have enough money in your bank account to place this bet.`);
      }

      if (!betType || (betType !== "red" && betType !== "black" && betType !== "green")) {
        return message.reply(`${lianeBank}\n\n✧ Hello ${userName}! Please enter your bet type as either "red," "black," or "green".`);
      }

      const colorOptions = ["red", "black", "green"];
      const winningColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      const winnings = betType === winningColor ? betAmount * 2 : 0;

      if (winnings > 0) {
        bankData[user].bank += winnings;
      } else {
        bankData[user].bank -= betAmount;
      }

      bankData[user].transactions.push({ type: 'Roulette', amount: betAmount, timestamp: Date.now() }); // Added transaction record
      fs.writeFileSync("bank.json", JSON.stringify(bankData));

      return message.reply(`${lianeBank}\n\n✧ Roulette result: ${winningColor}\n\n💲 Bet amount: ${betAmount}$\n\n💰 New bank balance: ${bankData[user].bank}$`);

    } else if (command === "gamble") {
      const betAmount = parseInt(args[1]);

      if (isNaN(betAmount) || betAmount <= 0) {
        return message.reply(`${lianeBank}\n\n✧ Hello ${userName}! Please enter a valid bet amount.💸`);
      }

      if (betAmount > bankData[user].bank) {
        return message.reply(`${lianeBank}\n\n✧ Sorry ${userName}, you don't have enough money in your bank account to place this bet.`);
      }

      const winChance = Math.random();
      const winAmount = betAmount * 3;

      if (winChance > 0.5) {
        bankData[user].bank += winAmount;
        bankData[user].transactions.push({ type: 'Gambling Win', amount: winAmount, timestamp: Date.now() }); // Added transaction record
        fs.writeFileSync("bank.json", JSON.stringify(bankData));
        return message.reply(`${lianeBank}\n\n✧ Congratulations ${userName}! You won the gamble!\n\n💲 Bet amount: ${betAmount}$\n\n💰 You won: ${winAmount}$\n\n💰 New bank balance: ${bankData[user].bank}$`);
      } else {
        bankData[user].bank -= betAmount;
        bankData[user].transactions.push({ type: 'Gambling Loss', amount: betAmount, timestamp: Date.now() }); // Added transaction record
        fs.writeFileSync("bank.json", JSON.stringify(bankData));
        return message.reply(`${lianeBank}\n\n✧ Better luck next time ${userName}! You lost the gamble.\n\n💲 Bet amount: ${betAmount}$\n\n💰 New bank balance: ${bankData[user
