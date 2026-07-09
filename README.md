# Remotetest

Sandbox repo for experiments. Two independent web apps live here as static HTML/JS.

## Apps

- **`stock-app/`** — Stock Signal: 티커 + 뉴스 텍스트로 매수/매도/홀드 판단.
  규칙 기반 기술지표(SMA, RSI, 모멘텀) + 뉴스 감성 스코어에 더해, 선택적으로 Claude API를 앙상블합니다.
  브라우저에서 `stock-app/index.html`을 열면 바로 사용 가능. API 키는 사용자의 localStorage에만 저장됩니다.

- **`history-app/`** — American History mini-games (5 games). 별개 사이드 프로젝트.
  `history-app/index.html` 실행.
