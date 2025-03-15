
const profile = {
    coins: 3000,
    gems: 300,
}

const reward = {
    coins: 3000,
    gems: "300",
}

const test = () => {
    profile.coins += Number(reward.coins);
    profile.gems += Number(reward.gems);
    console.log(profile)
}

test();