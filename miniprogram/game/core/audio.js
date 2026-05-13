class AudioController {
  constructor() {
    this.innerAudio = null;
    this.chart = null;
    this.endedHandler = null;
    this.errorHandler = null;
  }

  start(chart) {
    this.destroy();
    this.chart = chart;
    this.innerAudio = wx.createInnerAudioContext();
    this.innerAudio.obeyMuteSwitch = false;
    this.innerAudio.autoplay = false;
    this.innerAudio.loop = false;
    this.innerAudio.src = chart.audioSrc;
    this.innerAudio.startTime =
      Number.isFinite(chart.playbackStartTime) && chart.playbackStartTime >= 0
        ? chart.playbackStartTime
        : chart.audioStartTime || 0;

    if (this.endedHandler) {
      this.innerAudio.onEnded(this.endedHandler);
    }

    if (this.errorHandler) {
      this.innerAudio.onError(this.errorHandler);
    }

    this.innerAudio.play();
  }

  getCurrentChartTime() {
    if (!this.innerAudio || !this.chart) {
      return 0;
    }

    const time = this.innerAudio.currentTime - (this.chart.audioStartTime || 0);
    return Math.max(0, time);
  }

  onEnded(handler) {
    this.endedHandler = handler;
    if (this.innerAudio) {
      this.innerAudio.onEnded(handler);
    }
  }

  onError(handler) {
    this.errorHandler = handler;
    if (this.innerAudio) {
      this.innerAudio.onError(handler);
    }
  }

  stop() {
    if (this.innerAudio) {
      this.innerAudio.stop();
    }
  }

  pause() {
    if (this.innerAudio) {
      this.innerAudio.pause();
    }
  }

  resume() {
    if (this.innerAudio) {
      this.innerAudio.play();
    }
  }

  destroy() {
    if (this.innerAudio) {
      this.innerAudio.stop();
      this.innerAudio.destroy();
      this.innerAudio = null;
    }
  }
}

module.exports = AudioController;
