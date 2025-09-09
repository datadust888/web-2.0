// Пример добавления кейса с предметами (.jpg)
async function seedCase() {
  const exists = await Case.findOne({ name: "Free Case" });
  if (exists) return;

  const freeCase = new Case({
    name: "Free Case",
    price: 0,
    items: [
      { name: "+1 ⭐️", stars: 1, img: "items/star1.jpg", chance: 20 },
      { name: "+3 ⭐️", stars: 3, img: "items/star3.jpg", chance: 15 },
      { name: "+5 ⭐️", stars: 5, img: "items/star5.jpg", chance: 10 },
      { name: "+10 ⭐️", stars: 10, img: "items/star10.jpg", chance: 5 },
      { name: "+20 ⭐️", stars: 20, img: "items/telegram_gift2.jpg", chance: 2 }
    ]
  });

  await freeCase.save();
  console.log("✅ Free Case создан");
}

seedCase();