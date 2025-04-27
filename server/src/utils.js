async function signInShopee(page) {
  await page.goto("https://shopee.co.th/buyer/login", {
    waitUntil: "domcontentloaded",
  });

  await handleClickLangDialogShopee(page);

  await page.waitForSelector('input[name="loginKey"]', { visible: true });
  await page.waitForSelector('input[name="password"]', { visible: true });

  const usernameInput = await page.$('input[name="loginKey"]');

  const passwordInput = await page.$('input[name="password"]');

  await usernameInput.click();
  await randomDelay();
  await typeHumanLike(page, process.env.SP_USERNAME);

  await randomDelay(300, 600);

  await passwordInput.click();
  await randomDelay();
  await typeHumanLike(page, process.env.SP_PASSWORD);

  await randomDelay(500, 800);

  const loginButton = await page.$("form > button");
  await loginButton.hover();
  await randomDelay(500, 1000);
  await loginButton.click();
}

const handleClickLangDialogShopee = async (page) => {
  try {
    await page.waitForSelector(".language-selection__list-item > button", {
      timeout: 5000,
    });
    await page.click(".language-selection__list-item > button");
  } catch (error) {
    console.log("No language dialog found.");
  }
};

async function randomDelay(min = 100, max = 300) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

async function moveMouseNaturally(page) {
  const box = { width: 1280, height: 800 };
  const steps = 10;
  for (let i = 0; i < 3; i++) {
    const startX = Math.floor(Math.random() * box.width);
    const startY = Math.floor(Math.random() * box.height);
    const endX = Math.floor(Math.random() * box.width);
    const endY = Math.floor(Math.random() * box.height);

    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      const x = startX + t * (endX - startX);
      const y = startY + t * (endY - startY);
      await page.mouse.move(x, y);
      await randomDelay(20, 50);
    }
    await randomDelay(300, 600);
  }
}

async function typeHumanLike(page, text) {
  for (const char of text) {
    await page.keyboard.type(char);
    await randomDelay(100, 250);
  }
}

module.exports = {
  signInShopee,
  moveMouseNaturally,
};
