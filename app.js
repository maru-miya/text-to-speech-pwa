// maru-text-to-speech メインアプリケーション
class TextToSpeechApp {
  constructor() {
    this.synth = window.speechSynthesis;
    this.utterance = null;
    this.voices = [];
    this.currentLanguage = 'auto';
    this.isPlaying = false;
    this.isPaused = false;
    this.visualizer = null;
    this.animationId = null;

    this.initializeElements();
    this.initializeEventListeners();
    // テーマ機能削除
    this.initializeVoices();
    this.initializeVisualizer();
    this.initializePWA();
  }

  initializeElements() {
    // テキスト関連
    this.textInput = document.getElementById('textInput');
    this.charCount = document.getElementById('charCount');

    // 言語関連
    this.languageSelect = document.getElementById('languageSelect');
    this.detectedLanguage = document.getElementById('detectedLanguage');

    // 音声制御関連
    this.voiceSelect = document.getElementById('voiceSelect');
    this.genderSelect = document.getElementById('genderSelect');
    this.rateSlider = document.getElementById('rateSlider');
    this.rateValue = document.getElementById('rateValue');
    this.pitchSlider = document.getElementById('pitchSlider');
    this.pitchValue = document.getElementById('pitchValue');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.volumeValue = document.getElementById('volumeValue');

    // 再生制御関連
    this.playBtn = document.getElementById('playBtn');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.stopBtn = document.getElementById('stopBtn');

    // UI関連
    this.statusDisplay = document.getElementById('statusDisplay');
    this.visualizerCanvas = document.getElementById('visualizer');
    this.visualizerCtx = this.visualizerCanvas.getContext('2d');
  }

  initializeEventListeners() {
    // テキスト入力
    this.textInput.addEventListener('input', () => this.handleTextInput());
    this.textInput.addEventListener('paste', () => {
      setTimeout(() => this.handleTextInput(), 10);
    });

    // 言語選択
    this.languageSelect.addEventListener('change', () => this.handleLanguageChange());

    // 音声制御
    this.voiceSelect.addEventListener('change', () => this.handleVoiceChange());
    this.genderSelect.addEventListener('change', () => this.filterVoicesByGender());

    // スライダー
    this.rateSlider.addEventListener('input', () => this.updateSliderValue('rate'));
    this.pitchSlider.addEventListener('input', () => this.updateSliderValue('pitch'));
    this.volumeSlider.addEventListener('input', () => this.updateSliderValue('volume'));

    // 再生制御ボタン
    this.playBtn.addEventListener('click', () => this.handlePlay());
    this.pauseBtn.addEventListener('click', () => this.handlePause());
    this.stopBtn.addEventListener('click', () => this.handleStop());

    // テーマ切り替え機能を削除（ダークモード廃止）

    // キーボードショートカット
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

    // 音声合成イベント
    this.synth.addEventListener('voiceschanged', () => this.initializeVoices());

    // ページの可視性変更
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
  }

  handleTextInput() {
    const text = this.textInput.value;
    const length = text.length;

    // 文字数カウンタ更新
    this.charCount.textContent = `${length.toLocaleString()} / 10,000`;

    if (length > 9000) {
      this.charCount.style.color = 'var(--error-color)';
    } else if (length > 7000) {
      this.charCount.style.color = 'var(--warning-color)';
    } else {
      this.charCount.style.color = 'var(--text-muted)';
    }

    // 自動言語判定
    if (this.languageSelect.value === 'auto' && text.trim()) {
      this.detectLanguage(text);
    } else if (!text.trim()) {
      this.detectedLanguage.textContent = '';
    }
  }

  detectLanguage(text) {
    // 日本語文字の検出（ひらがな、カタカナ、漢字）
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    const hasJapanese = japaneseRegex.test(text);

    // 英語アルファベットの検出
    const englishRegex = /[a-zA-Z]/;
    const hasEnglish = englishRegex.test(text);

    let detectedLang = 'ja-JP'; // デフォルトは日本語

    if (hasJapanese && hasEnglish) {
      // 混在テキストの場合、日本語文字の割合で判定
      const japaneseChars = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || [];
      const totalChars = text.replace(/\s/g, '').length;
      const japaneseRatio = japaneseChars.length / totalChars;

      detectedLang = japaneseRatio > 0.3 ? 'ja-JP' : 'en-US';
    } else if (hasEnglish && !hasJapanese) {
      detectedLang = 'en-US';
    }

    this.currentLanguage = detectedLang;
    this.updateDetectedLanguageDisplay(detectedLang);
    this.filterVoicesByLanguage(detectedLang);
  }

  updateDetectedLanguageDisplay(lang) {
    const langNames = {
      'ja-JP': '日本語',
      'en-US': '英語 (米国)',
      'en-GB': '英語 (英国)'
    };

    this.detectedLanguage.textContent = `検出言語: ${langNames[lang] || lang}`;
  }

  handleLanguageChange() {
    const selectedLang = this.languageSelect.value;

    if (selectedLang === 'auto') {
      if (this.textInput.value.trim()) {
        this.detectLanguage(this.textInput.value);
      } else {
        this.detectedLanguage.textContent = '';
      }
    } else {
      this.currentLanguage = selectedLang;
      this.detectedLanguage.textContent = '';
      this.filterVoicesByLanguage(selectedLang);
    }
  }

  initializeVoices() {
    this.voices = this.synth.getVoices();

    if (this.voices.length === 0) {
      // 音声がまだ読み込まれていない場合、少し待ってから再試行
      setTimeout(() => this.initializeVoices(), 100);
      return;
    }

    this.populateVoiceSelect();
    this.filterVoicesByGender();
  }

  populateVoiceSelect() {
    this.voiceSelect.innerHTML = '';

    // 現在の言語に適した音声をフィルタリング
    let filteredVoices = this.voices;

    if (this.currentLanguage && this.currentLanguage !== 'auto') {
      filteredVoices = this.voices.filter(voice =>
        voice.lang.startsWith(this.currentLanguage.split('-')[0])
      );
    }

    // 性別フィルタリング
    const genderFilter = this.genderSelect.value;
    if (genderFilter !== 'all') {
      filteredVoices = filteredVoices.filter(voice => {
        const gender = this.getVoiceGender(voice);
        return gender === genderFilter || (genderFilter === 'unknown' && gender === 'unknown');
      });
    }

    if (filteredVoices.length === 0) {
      filteredVoices = this.voices; // フィルタ結果が空の場合は全音声を表示
    }

    // 高品質音声を優先してソート
    filteredVoices.sort((a, b) => {
      // 品質による優先順位
      const qualityOrder = { local: 0, default: 1, premium: 2, standard: 3 };

      // ローカル音声を最優先
      if (a.localService !== b.localService) {
        return a.localService ? -1 : 1;
      }

      // デフォルト音声を次に優先
      if (a.default !== b.default) {
        return a.default ? -1 : 1;
      }

      // 性別で分類
      const aGender = this.getVoiceGender(a);
      const bGender = this.getVoiceGender(b);
      if (aGender !== bGender) {
        // 女性、男性、不明の順
        const genderOrder = { female: 0, male: 1, unknown: 2 };
        return (genderOrder[aGender] || 2) - (genderOrder[bGender] || 2);
      }

      // 名前でソート
      return a.name.localeCompare(b.name);
    });

    // 音声インデックスマッピングを保存
    this.currentFilteredVoices = filteredVoices;

    filteredVoices.forEach((voice, index) => {
      const option = document.createElement('option');
      option.value = index;

      // 音声の詳細情報を表示
      const gender = this.getVoiceGender(voice);
      const genderIcon = gender === 'female' ? '👩' : gender === 'male' ? '👨' : '🔊';
      const qualityIcon = voice.localService ? '🏆' : voice.default ? '⭐' : '';

      option.textContent = `${genderIcon} ${voice.name} (${voice.lang}) ${qualityIcon}`;
      this.voiceSelect.appendChild(option);
    });

    // 最適な音声を自動選択
    let preferredIndex = 0;

    // 1. 現在の言語に完全一致するローカル音声
    let bestMatch = filteredVoices.findIndex(voice =>
      voice.localService && voice.lang === this.currentLanguage
    );

    // 2. 現在の言語に部分一致するローカル音声
    if (bestMatch === -1) {
      bestMatch = filteredVoices.findIndex(voice =>
        voice.localService && voice.lang.startsWith(this.currentLanguage.split('-')[0])
      );
    }

    // 3. 現在の言語のデフォルト音声
    if (bestMatch === -1) {
      bestMatch = filteredVoices.findIndex(voice =>
        voice.default && voice.lang.startsWith(this.currentLanguage.split('-')[0])
      );
    }

    // 4. 最初のローカル音声
    if (bestMatch === -1) {
      bestMatch = filteredVoices.findIndex(voice => voice.localService);
    }

    if (bestMatch !== -1) {
      preferredIndex = bestMatch;
    }

    this.voiceSelect.selectedIndex = preferredIndex;
  }

  getVoiceGender(voice) {
    const name = voice.name.toLowerCase();

    // より詳細な音声識別キーワード
    const femaleKeywords = [
      'female', 'woman', 'girl', 'lady', 'f',
      'さくら', 'はるか', 'kyoko', 'sara', 'voice1', 'voice3',
      'zira', 'hazel', 'susan', 'helen', 'karen', 'samantha',
      'microsoft haruka', 'microsoft sayaka', 'microsoft ayumi'
    ];

    const maleKeywords = [
      'male', 'man', 'boy', 'gentleman', 'm',
      'たろう', 'takeshi', 'ichiro', 'voice2', 'voice4',
      'david', 'mark', 'george', 'alex', 'daniel',
      'microsoft ichiro', 'microsoft haruto'
    ];

    // 日本語音声の特別判定
    if (voice.lang && voice.lang.startsWith('ja')) {
      // Microsoft 日本語音声の判定
      if (name.includes('haruka') || name.includes('sayaka') || name.includes('ayumi')) return 'female';
      if (name.includes('ichiro') || name.includes('haruto')) return 'male';

      // Google 日本語音声の判定
      if (name.includes('female') || name.includes('woman')) return 'female';
      if (name.includes('male') || name.includes('man')) return 'male';
    }

    // 英語音声の判定
    if (voice.lang && voice.lang.startsWith('en')) {
      if (femaleKeywords.some(keyword => name.includes(keyword))) return 'female';
      if (maleKeywords.some(keyword => name.includes(keyword))) return 'male';
    }

    // 一般的な判定
    if (femaleKeywords.some(keyword => name.includes(keyword))) {
      return 'female';
    }
    if (maleKeywords.some(keyword => name.includes(keyword))) {
      return 'male';
    }

    // 推測不可能な場合は音声の特性で判定（簡易版）
    // 日本語音声はデフォルトで女性、英語音声は不明として扱う
    if (voice.lang && voice.lang.startsWith('ja')) {
      return 'female';
    }

    return 'unknown';
  }

  filterVoicesByLanguage(lang) {
    this.populateVoiceSelect();
  }

  filterVoicesByGender() {
    this.populateVoiceSelect();
  }

  handleVoiceChange() {
    // 音声変更時の処理（必要に応じて追加）
  }

  updateSliderValue(type) {
    const slider = document.getElementById(`${type}Slider`);
    const valueDisplay = document.getElementById(`${type}Value`);
    const value = slider.value;

    if (type === 'volume') {
      valueDisplay.textContent = Math.round(value);
    } else {
      valueDisplay.textContent = parseFloat(value).toFixed(1);
    }
  }

  createUtterance() {
    let text = this.textInput.value.trim();
    if (!text) {
      this.showError('テキストを入力してください。');
      return null;
    }

    // テキストの前処理（日本語音声品質改善）
    text = this.preprocessText(text);

    this.utterance = new SpeechSynthesisUtterance(text);

    // 音声選択（改良されたマッピング使用）
    const selectedVoiceIndex = parseInt(this.voiceSelect.value);
    if (this.currentFilteredVoices && this.currentFilteredVoices[selectedVoiceIndex]) {
      this.utterance.voice = this.currentFilteredVoices[selectedVoiceIndex];
    } else if (this.voices[selectedVoiceIndex]) {
      this.utterance.voice = this.voices[selectedVoiceIndex];
    }

    // 言語設定
    this.utterance.lang = this.currentLanguage;

    // 音声パラメータ設定（日本語音声最適化）
    const selectedVoice = this.utterance.voice;
    this.utterance.rate = this.optimizeRateForVoice(parseFloat(this.rateSlider.value), selectedVoice);
    this.utterance.pitch = this.optimizePitchForVoice(parseFloat(this.pitchSlider.value), selectedVoice);
    this.utterance.volume = parseFloat(this.volumeSlider.value) / 100;

    // イベントハンドラ設定
    this.utterance.onstart = () => this.handleSpeechStart();
    this.utterance.onend = () => this.handleSpeechEnd();
    this.utterance.onerror = (event) => this.handleSpeechError(event);
    this.utterance.onpause = () => this.handleSpeechPause();
    this.utterance.onresume = () => this.handleSpeechResume();

    return this.utterance;
  }

  preprocessText(text) {
    // 絵文字や特殊記号を除去（読み上げスキップ）
    text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

    // 機械的記号を読みやすい形に変換
    text = text.replace(/&/g, 'アンド');
    text = text.replace(/@/g, 'アットマーク');
    text = text.replace(/#/g, 'ハッシュ');
    text = text.replace(/\$/g, 'ドル');
    text = text.replace(/%/g, 'パーセント');
    text = text.replace(/\+/g, 'プラス');
    text = text.replace(/=/g, 'イコール');

    // URLの簡略化
    text = text.replace(/https?:\/\/[^\s]+/g, 'リンク');

    // メールアドレスの簡略化
    text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'メールアドレス');

    // 連続する句読点の正規化
    text = text.replace(/[。]{2,}/g, '。');
    text = text.replace(/[、]{2,}/g, '、');

    // 数字の読み上げ改善
    text = text.replace(/(\d+)年/g, '$1ねん');
    text = text.replace(/(\d+)月/g, '$1がつ');
    text = text.replace(/(\d+)日/g, '$1にち');

    // 空白の正規化
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  optimizeRateForVoice(rate, voice) {
    if (!voice) return rate;

    // 日本語音声の速度最適化
    if (voice.lang && voice.lang.startsWith('ja')) {
      // 日本語音声は通常より遅めが自然
      return Math.max(0.7, rate * 0.9);
    }

    return rate;
  }

  optimizePitchForVoice(pitch, voice) {
    if (!voice) return pitch;

    // 日本語音声のピッチ最適化
    if (voice.lang && voice.lang.startsWith('ja')) {
      // 極端なピッチ変更を避ける
      return Math.max(0.8, Math.min(1.2, pitch));
    }

    return pitch;
  }

  handlePlay() {
    if (!this.isPlaying && !this.isPaused) {
      // 新規再生
      const utterance = this.createUtterance();
      if (!utterance) return;

      this.synth.speak(utterance);
    } else if (this.isPaused) {
      // 一時停止からの再開
      this.synth.resume();
    }
  }

  handlePause() {
    if (this.isPlaying && !this.isPaused) {
      // 読み上げ中の場合のみ一時停止
      this.synth.pause();
    }
  }

  handleStop() {
    // 完全停止：読み上げをキャンセルして最初から停止
    this.synth.cancel();
    this.handleSpeechEnd();
  }

  handleSpeechStart() {
    this.isPlaying = true;
    this.isPaused = false;
    this.updateControlButtons();
    this.updateStatus('読み上げ中...', 'speaking');
    this.startVisualizer();
  }

  handleSpeechEnd() {
    this.isPlaying = false;
    this.isPaused = false;
    this.updateControlButtons();
    this.updateStatus('準備完了', 'ready');
    this.stopVisualizer();
  }

  handleSpeechPause() {
    this.isPaused = true;
    this.updateControlButtons();
    this.updateStatus('一時停止中', 'paused');
  }

  handleSpeechResume() {
    this.isPaused = false;
    this.updateControlButtons();
    this.updateStatus('読み上げ中...', 'speaking');
  }

  handleSpeechError(event) {
    console.error('Speech synthesis error:', event);
    this.isPlaying = false;
    this.isPaused = false;
    this.updateControlButtons();
    this.showError(`音声合成エラー: ${event.error}`);
    this.stopVisualizer();
  }

  updateControlButtons() {
    // 再生ボタン：停止中または一時停止中に有効
    this.playBtn.disabled = this.isPlaying && !this.isPaused;

    // 一時停止ボタン：読み上げ中のみ有効
    this.pauseBtn.disabled = !this.isPlaying || this.isPaused;

    // 停止ボタン：読み上げ中または一時停止中に有効
    this.stopBtn.disabled = !this.isPlaying && !this.isPaused;

    // ボタンテキストの更新
    if (this.isPaused) {
      this.playBtn.querySelector('.btn-text').textContent = '再開';
      this.playBtn.setAttribute('aria-label', '読み上げ再開');
    } else {
      this.playBtn.querySelector('.btn-text').textContent = '再生';
      this.playBtn.setAttribute('aria-label', '読み上げ開始');
    }
  }

  updateStatus(message, type = 'ready') {
    this.statusDisplay.textContent = message;
    this.statusDisplay.className = `status-display ${type}`;
  }

  showError(message) {
    this.updateStatus(message, 'error');
    setTimeout(() => {
      if (!this.isPlaying) {
        this.updateStatus('準備完了', 'ready');
      }
    }, 3000);
  }

  initializeVisualizer() {
    this.visualizerCanvas.width = 400;
    this.visualizerCanvas.height = 100;
    this.drawVisualizerIdle();
  }

  startVisualizer() {
    this.visualizerCanvas.classList.add('active');
    this.animateVisualizer();
  }

  stopVisualizer() {
    this.visualizerCanvas.classList.remove('active');
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.drawVisualizerIdle();
  }

  animateVisualizer() {
    const canvas = this.visualizerCanvas;
    const ctx = this.visualizerCtx;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 波形描画
    const time = Date.now() * 0.005;
    const centerY = height / 2;
    const amplitude = height * 0.3;

    // グラデーション作成
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#4facfe');
    gradient.addColorStop(0.5, '#00f2fe');
    gradient.addColorStop(1, '#4facfe');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    // 複数の波を描画
    for (let wave = 0; wave < 3; wave++) {
      ctx.beginPath();
      ctx.globalAlpha = 0.7 - wave * 0.2;

      for (let x = 0; x < width; x += 2) {
        const y = centerY +
          Math.sin((x * 0.02) + time + wave) * amplitude * (0.5 + wave * 0.3) +
          Math.sin((x * 0.01) + time * 1.5 + wave) * amplitude * 0.3;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    if (this.isPlaying) {
      this.animationId = requestAnimationFrame(() => this.animateVisualizer());
    }
  }

  drawVisualizerIdle() {
    const canvas = this.visualizerCanvas;
    const ctx = this.visualizerCtx;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // アイドル状態の直線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd キーと組み合わせたショートカット
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          this.handlePlay();
          break;
        case ' ':
          event.preventDefault();
          if (this.isPlaying && !this.isPaused) {
            this.handlePause();
          } else if (this.isPaused) {
            this.handlePlay();
          }
          break;
        case 'Escape':
          event.preventDefault();
          this.handleStop();
          break;
        // ダークモード機能削除済み
      }
    }
  }

  // テーマ機能削除（ライトモード固定）

  handleVisibilityChange() {
    // ページが非表示になったときに音声を停止（オプション）
    if (document.hidden && this.isPlaying) {
      // 必要に応じてコメントアウト
      // this.handlePause();
    }
  }

  initializePWA() {
    // Service Worker登録
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js')
        .then(registration => {
          console.log('Service Worker registered successfully:', registration);

          // アップデート確認
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateNotification();
              }
            });
          });
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }

    // インストールプロンプト処理
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.showInstallPrompt(event);
    });

    // PWAインストール完了
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.updateStatus('アプリがインストールされました', 'ready');
    });
  }

  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <p>新しいバージョンが利用可能です</p>
      <button onclick="location.reload()">更新</button>
      <button onclick="this.parentElement.remove()">後で</button>
    `;
    document.body.appendChild(notification);
  }

  showInstallPrompt(event) {
    // カスタムインストールプロンプトを表示（オプション）
    console.log('PWA install prompt available');
  }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
  // Web Speech API対応チェック
  if (!('speechSynthesis' in window)) {
    alert('お使いのブラウザはWeb Speech APIをサポートしていません。\n対応ブラウザ（Chrome、Firefox、Safari、Edge）をご利用ください。');
    return;
  }

  // アプリケーション開始
  window.ttsApp = new TextToSpeechApp();

  console.log('maru-text-to-speech initialized successfully');
});