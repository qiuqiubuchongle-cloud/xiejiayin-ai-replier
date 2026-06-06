const sceneLabels = {
  complaint: "用户吐槽",
  support: "客服慢",
  feature: "功能催更",
  crisis: "公关回应",
  promo: "产品种草",
  tweet: "推文"
};

const toneLabels = {
  xie: "谢家印原味",
  service: "暖男客服",
  pr: "品牌公关",
  web3: "Web3 社交",
  redbook: "小红书种草"
};

const templates = {
  complaint: [
    "收到，先抱歉让你体验不好。我帮你记录推进，操心的事我们来做{emoji}",
    "我看到了，先抱歉让你着急。你把最难用的点丢给我，我帮你同步团队{emoji}",
    "没关系，这条反馈我先记下。真实体验最重要，我们继续改{emoji}"
  ],
  support: [
    "收到，先抱歉让你等久了。我帮你记录推进，很快给你答复{emoji}",
    "先抱歉让你来回折腾。你先不用重复提交，我帮你确认，进展我来跟{emoji}",
    "理解你的感受，我先替你把这件事捋清楚，不让你白等{emoji}"
  ],
  feature: [
    "来了来了，已经在推进。我先帮你盯着，很快见惊喜{emoji}",
    "收到，这个需求我记下。真实反馈我都认真看，进展我来跟{emoji}",
    "很快。你先别急，操心的事我们来做{emoji}"
  ],
  crisis: [
    "我看到了，先抱歉让你着急。用户利益第一，我先同步团队核实，进展我来跟{emoji}",
    "这件事我不回避。能确认的我直接说，不能确认的我先推进{emoji}",
    "先把问题解决，再把体验补回来。这条我记下，不让你白反馈{emoji}"
  ],
  promo: [
    "你先体验，感受最重要。好用再安利，不好用我继续改{emoji}",
    "Bitget，来了就是VIP{emoji} 你先体验，真实反馈我都认真看。",
    "这波我先替大家踩坑推进。真实体验过关，再来安利{emoji}"
  ],
  tweet: [
    "谢家印AI上线：来了就是VIP，接住你的所有情绪。不还嘴、不抱怨、不下班{emoji}",
    "把用户吐槽丢进来，生成一条短、暖、稳的回复。真正有温度的是人，skill 只是小工具{emoji}",
    "社区运营每天都在接情绪。谢家印AI做的事很简单：先抱歉，再推进，最后把用户当VIP{emoji}"
  ]
};

const toneAddons = {
  xie: "",
  service: "你先别担心。",
  pr: "用户利益第一。",
  web3: "gm，收到。",
  redbook: "真实体验最重要。"
};

const form = document.querySelector("#replyForm");
const userMessage = document.querySelector("#userMessage");
const sceneSelect = document.querySelector("#sceneSelect");
const toneSelect = document.querySelector("#toneSelect");
const resultList = document.querySelector("#resultList");
const emojiToggle = document.querySelector("#emojiToggle");
const shortToggle = document.querySelector("#shortToggle");

function emoji() {
  return emojiToggle.checked ? "🩵" : "";
}

function cleanReply(text) {
  return text.replace(/\s+/g, " ").replace(/\s+([，。])/g, "$1").trim();
}

function fallbackReplies() {
  const scene = sceneSelect.value;
  const tone = toneSelect.value;
  const message = userMessage.value.trim();
  const base = templates[scene] || templates.complaint;
  const addon = toneAddons[tone];
  const replies = base.map((line, index) => {
    let reply = line.replace("{emoji}", emoji());

    if (tone !== "xie" && index === 0) {
      reply = `${addon}${reply}`;
    }

    if (tone === "web3" && scene !== "crisis" && index === 1) {
      reply = `alpha 收到，我帮你盯。DYOR，别上头${emoji()}`;
    }

    if (tone === "redbook" && scene !== "crisis" && index === 1) {
      reply = `被种草可以，先小额体验。好用再安利，不好用我继续改${emoji()}`;
    }

    if (shortToggle.checked && reply.length > 68) {
      reply = reply.replace("你把最难用的点丢给我，", "").replace("真实反馈我都认真看，", "");
    }

    if (message.includes("钱包") && scene === "complaint" && index === 0) {
      reply = `收到，先抱歉让你体验不好。钱包最难用的点丢给我，我帮你记录推进${emoji()}`;
    }

    return cleanReply(reply);
  });

  return replies;
}

async function generateReplies() {
  const scene = sceneSelect.value;
  const tone = toneSelect.value;
  const payload = {
    message: userMessage.value.trim(),
    scene,
    tone,
    emoji: emojiToggle.checked,
    short: shortToggle.checked
  };

  let replies = null;
  let source = "本地模板";

  try {
    const response = await fetch("/api/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.replies) && data.replies.length) {
        replies = data.replies;
        source = data.source === "openai" ? "Skill 后端" : "Skill 模板";
      }
    }
  } catch {
    source = "本地模板";
  }

  if (!replies) replies = fallbackReplies();
  renderReplies(replies, scene, tone, source);
}

function renderReplies(replies, scene, tone, source = "本地模板") {
  resultList.innerHTML = replies
    .map((reply, index) => {
      return `
        <article class="result-card">
          <header>
            <strong>${sceneLabels[scene]} / ${toneLabels[tone]} / ${source} / 0${index + 1}</strong>
            <button class="copy-button" type="button" data-copy="${encodeURIComponent(reply)}">复制</button>
          </header>
          <p>${reply}</p>
        </article>
      `;
    })
    .join("");

  if (window.gsap) {
    gsap.fromTo(
      ".result-card",
      { y: 16, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.48, ease: "power2.out", stagger: 0.08 }
    );
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  generateReplies();
});

resultList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]");
  if (!button) return;
  const text = decodeURIComponent(button.dataset.copy);
  await navigator.clipboard.writeText(text);
  button.textContent = "已复制";
  setTimeout(() => {
    button.textContent = "复制";
  }, 1200);
});

function bootAnimations() {
  if (!window.gsap) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const tl = gsap.timeline({ defaults: { duration: 0.72, ease: "power2.out" } });
  tl.from(".site-header", { y: -18, autoAlpha: 0 })
    .from(".gallery-label span", { y: 16, autoAlpha: 0, stagger: 0.08 }, "<0.12")
    .from(".hero-copy > *", { y: 26, autoAlpha: 0, stagger: 0.1 }, "<0.1")
    .from(".hero-art", { y: 34, autoAlpha: 0 }, "<0.18")
    .from(".exhibit-card", { y: 28, autoAlpha: 0, stagger: 0.08 }, "-=0.2");
}

bootAnimations();
generateReplies();
