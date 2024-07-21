const fs = require('fs');

module.exports = {
  config: {
    name: "slot",
    version: "1.5",
    author: "Itz Aryan",
    longDescription: {
      en: "Game slot with bonus rounds, multipliers, and interactive elements.",
    },
    category: "game",
  },
  langs: {
    en: {
      invalid_amount: "🎲 Invalid input. Please enter a valid amount. Example: [ .slot ] < 1000 >",
      not_enough_money: "🎲 Not enough money. Check your balance and try again. Type [ .bal ] to see your balance.",
      spin_message: "Spinning...",
      win_message: "🎲 You won %1$! Congratulations! 💰",
      lose_message: "🎲 You lost %1$. Better luck next time! 😞",
      jackpot_message: "💰 JACKPOT! You won %1$!",
      bonus_round: "🎉 Bonus Round activated! Enjoy the extra winnings!",
      multiplier_message: "🔥 Multiplier activated! Your winnings are multiplied by %1$!",
      special_event_message: "🌟 Special Event! You receive a special reward: %1$!",
      symbols_changed: "Symbols changed successfully!",
      leaderboard_header: "🏆 Slot Machine Leaderboard:",
      achievement_unlocked: "🏅 Achievement Unlocked: %1$!",
      bankruptcy_protection: "💼 You've reached the minimum balance. A loan of %1$ has been added to your account.",
      bet_amount_changed: "💵 Bet amount changed to %1$.",
      daily_reward_claimed: "🎁 Per slot return reward claimed! You received %1$.",
      vip_level_up: "🎉 Congratulations! You've reached VIP level %1$!",
      theme_changed: "🎨 Slot theme changed to %1$.",
      mini_game_started: "🕹️ Mini-game started! Good luck!",
      social_share: "📢 Shared your winnings on social media!",
    },
  },
  onStart: async function ({ args, message, event, envCommands, usersData, commandName, getLang }) {
    const { senderID } = event;
    const userData = await usersData.get(senderID);
    let amount = parseInt(args[0]);

    if (isNaN(amount) || amount <= 0) {
      return message.reply(getLang("invalid_amount"));
    }

    if (amount > userData.money) {
      return message.reply(getLang("not_enough_money"));
    }

    const slots = ["❤", "🧡", "💚", "💙", "💝", "💛", "💜", "💓", "💔"];
    const slot1 = slots[Math.floor(Math.random() * slots.length)];
    const slot2 = slots[Math.floor(Math.random() * slots.length)];
    const slot3 = slots[Math.floor(Math.random() * slots.length)];

    let winnings = calculateWinnings(slot1, slot2, slot3, amount);

    // Simulate bonus round activation with a small chance
    const bonusRoundChance = 0.1; // 10% chance of bonus round
    const isBonusRound = Math.random() < bonusRoundChance;

    if (isBonusRound) {
      winnings *= 2; // Double winnings during bonus round
      message.reply(getLang("bonus_round"));
    }

    // Simulate multiplier activation with a small chance
    const multiplierChance = 0.05; // 5% chance of multiplier
    const multiplier = Math.floor(Math.random() * 5) + 2; // Random multiplier between 2 and 6
    const isMultiplier = Math.random() < multiplierChance;

    if (isMultiplier) {
      winnings *= multiplier;
      message.reply(getLang("multiplier_message", multiplier));
    }

    // Simulate special event with a small chance
    const specialEventChance = 0.05; // 5% chance of special event
    const specialReward = Math.floor(Math.random() * 100) + 50; // Random reward between 50 and 150
    const isSpecialEvent = Math.random() < specialEventChance;

    if (isSpecialEvent) {
      userData.money += specialReward;
      message.reply(getLang("special_event_message", specialReward));
    }

    // Daily reward
    const dailyRewardAmount = 100;
    userData.money += dailyRewardAmount;
    message.reply(getLang("daily_reward_claimed", dailyRewardAmount));

    // VIP level up
    if (userData.money >= 1000 && userData.vipLevel === 0) {
      userData.vipLevel = 1;
      message.reply(getLang("vip_level_up", userData.vipLevel));
    }

    userData.money += winnings;

    if (userData.money < 100) {
      const loanAmount = 500;
      userData.money += loanAmount;
      message.reply(getLang("bankruptcy_protection", loanAmount));
    }

    await usersData.set(senderID, userData);

    const messageText = getSpinResultMessage(slot1, slot2, slot3, winnings, getLang);

    // Mini-game started
    const miniGameChance = 0.2; // 20% chance of mini-game
    const isMiniGame = Math.random() < miniGameChance;
    if (isMiniGame) {
      message.reply(getLang("mini_game_started"));
    }

    // Social share
    const socialShareChance = 0.1; // 10% chance of social share
    const isSocialShare = Math.random() < socialShareChance;
    if (isSocialShare) {
      message.reply(getLang("social_share"));
    }

    return message.reply(messageText);
  },
};

function calculateWinnings(slot1, slot2, slot3, betAmount) {
  if (slot1 === slot2 && slot2 === slot3) {
    return betAmount * 3;
  } else if (slot1 === slot2 || slot1 === slot3 || slot2 === slot3) {
    return betAmount * 2;
  } else {
    return -betAmount;
  }
}

function getSpinResultMessage(slot1, slot2, slot3, winnings, getLang) {
  if (winnings > 0) {
    if (slot1 === slot2 && slot2 === slot3) {
      return getLang("jackpot_message", winnings);
    } else {
      return getLang("win_message", winnings) + `\n\n[ ${slot1} | ${slot2} | ${slot3} ]`;
    }
  } else {
    return getLang("lose_message", -winnings) + `\n\n[ ${slot1} | ${slot2} | ${slot3} ]`;
  }
}
