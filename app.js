const { createApp } = Vue;

createApp({
  data() {
    return {
      now: new Date(),
      milestones: [
        { id: '1h', title: '1 Hour In', description: 'You survived the opening grind.', thresholdMinutes: 60, unlocked: false },
        { id: 'half', title: 'Halfway Thru', description: '4 hours down, 4 to go.', thresholdMinutes: 240, unlocked: false },
        { id: '1left', title: '1 Hour Left', description: 'Final lap initiated.', thresholdMinutes: 420, unlocked: false },
        { id: '10left', title: '10 Minutes Left', description: 'Victory is almost yours.', thresholdMinutes: 470, unlocked: false },
      ],
      alerted: new Set(),
      shiftLengthMs: 8 * 60 * 60 * 1000,
      achievementSoundUrl: 'https://www.myinstants.com/media/sounds/steam-achievement.mp3',
      achievementQueue: [],
      isProcessingQueue: false,
      queueDelayMs: 1250,
    };
  },
  computed: {
    shiftWindow() {
      const now = this.now;
      const dateInEst = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now);

      const start = new Date(`${dateInEst}T14:30:00-05:00`);
      const end = new Date(start.getTime() + this.shiftLengthMs);
      return { start, end };
    },
    elapsedMs() {
      const { start, end } = this.shiftWindow;
      if (this.now < start) return 0;
      if (this.now > end) return this.shiftLengthMs;
      return this.now - start;
    },
    elapsedLabel() {
      const totalSeconds = Math.floor(this.elapsedMs / 1000);
      const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const ss = String(totalSeconds % 60).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    },
    progressPercent() {
      return Math.max(0, Math.min(100, (this.elapsedMs / this.shiftLengthMs) * 100));
    },
    mainAchievement() {
      return {
        id: 'main',
        title: 'Workhorse: Complete Your 8-Hour Shift',
        description: 'Finish your full 2:30 PM – 10:30 PM EST shift.',
        unlocked: this.progressPercent >= 100,
      };
    },
    statusText() {
      const { start, end } = this.shiftWindow;
      if (this.now < start) return `Shift starts at ${start.toLocaleTimeString()}.`;
      if (this.now > end) return 'Shift complete. Clock out and collect XP.';
      const remaining = end - this.now;
      const mins = Math.floor(remaining / 60000);
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `Time remaining: ${hrs}h ${remMins}m`;
    },
  },
  methods: {
    requestNotifications() {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    },
    playAchievementSound() {
      const audio = new Audio(this.achievementSoundUrl);
      audio.volume = 0.45;
      audio.play().catch(() => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 1046;
        gain.gain.value = 0.07;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      });
    },
    notify(text) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Achievement Unlocked', { body: text });
      }
    },
    queueAchievement(achievement) {
      this.achievementQueue.push(achievement);
      this.processAchievementQueue();
    },
    processAchievementQueue() {
      if (this.isProcessingQueue || this.achievementQueue.length === 0) return;

      this.isProcessingQueue = true;
      const nextAchievement = this.achievementQueue.shift();
      this.playAchievementSound();
      this.notify(`${nextAchievement.title} unlocked!`);

      setTimeout(() => {
        this.isProcessingQueue = false;
        this.processAchievementQueue();
      }, this.queueDelayMs);
    },
    evaluateAchievements() {
      const elapsedMins = this.elapsedMs / 60000;

      this.milestones.forEach((achievement) => {
        if (!achievement.unlocked && elapsedMins >= achievement.thresholdMinutes) {
          achievement.unlocked = true;
        }

        if (achievement.unlocked && !this.alerted.has(achievement.id)) {
          this.alerted.add(achievement.id);
          this.queueAchievement(achievement);
        }
      });

      if (this.mainAchievement.unlocked && !this.alerted.has(this.mainAchievement.id)) {
        this.alerted.add(this.mainAchievement.id);
        this.queueAchievement(this.mainAchievement);
      }
    },
  },
  mounted() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    this.timer = setInterval(() => {
      this.now = new Date();
      this.evaluateAchievements();
    }, 1000);

    this.evaluateAchievements();
  },
  beforeUnmount() {
    clearInterval(this.timer);
  },
}).mount('#app');
