const W = 500;
const HT = 90;
const HM = 400;
const HL = 5;
const HB = 90;

let currentID = 0;

let info;
let infoHeight;
let offset = 0;
let offsetDir = 1;
let timeout = 0;

let title;
let startDate;
let scrollSpeed;
let pauseDuration;
let challenges;

let challengeUpdateSource;

function setup() {
	const params = getURLParams();
	if (params.id) {
		let host =
			location.hostname == '127.0.0.1' || location.hostname == 'localhost'
				? 'http://127.0.0.1:3000'
				: `https://win-challenge-backend${getURLPath()[0] == 'dev' ? '-dev' : ''}.up.railway.app`;
		challengeUpdateSource = new EventSource(host + '/settings/' + params.id);
		challengeUpdateSource.onmessage = event => {
			console.log(event, event.data);
			loadChallengeSettingFromCode(JSON.parse(event.data));
		};
		// challengeUpdateSource.close();
	} else if (params.code) {
		params.code = decodeURI(params.code);
		loadChallengeSettingFromCode(params.code);
	} else {
		loadChallengeSettingFromCode(getItem('challengeCode'));
	}

	createCanvas(W, HT + HL + HM + HL + HB);

	noStroke();
	textAlign(CENTER, CENTER);
	textSize(HT * 0.5);
	textStyle(BOLD);
	info = createGraphics(W - 50, HM - 10);
	info.stroke(0, 100);
	info.textAlign(LEFT, TOP);
	info.textSize(HT * 0.47);
	info.textStyle(BOLD);
	info.textLeading(HT * 0.52);
}

function draw() {
	clear();

	fill(163, 224, 201);
	rect(0, 0, W, HT);
	fill(70, 85, 80);
	rect(0, HT, W, HL);

	fill(50, 60, 60, 150);
	rect(0, HT + HL, W, HM);

	fill(150, 200, 175);
	rect(0, HT + HL + HM, W, HL);
	fill(70, 85, 80);
	rect(0, HT + HL + HM + HL, W, HB);

	if (title) fill(50, 60, 58);
	else fill(125, 175, 150);
	text(title || 'title', W / 2, HT / 2);

	let h = 0;
	info.clear();
	for (let i = 0; i < challenges?.length; i++) {
		const challenge = challenges[i];

		if (challenge.finished) info.fill(100, 200, 100);
		else info.fill(235, 245, 255);

		let challengeInfo = challenge.name;
		if (challenge.current || challenge.total) challengeInfo += ' ' + (challenge.current ?? 0);
		if (challenge.total) challengeInfo += '/' + challenge.total;

		info.text(challengeInfo, 0, h - offset, W - 50);

		h += HT * 0.52 + HT * 0.2;
		if (info.textWidth(challengeInfo) > W - 52) h += HT * 0.52;

		if (i + 1 == challenges.length) continue;
		info.fill(70, 85, 80, 100);
		info.rect(0, h - offset - HT * 0.19, W - 52, HL);
	}
	h -= HT * 0.13;
	infoHeight = h;
	image(info, 25, HT + HL + 10);

	if (startDate) {
		fill(235, 245, 255);
		const millis = Date.now() - new Date(startDate);
		const secs = Math.floor(millis / 1000);
		const mins = Math.floor(secs / 60);
		const hours = Math.floor(mins / 60);
		text(`${nf(hours, 2, 0)}:${nf(mins % 60, 2, 0)}:${nf(secs % 60, 2, 0)}`, W / 2, HT + HM + HL + HB / 2 + 9);
	} else {
		fill(163, 224, 201);
		text('00:00:00', W / 2, HT + HM + HL + HB / 2 + 9);
	}

	if (timeout > 0) {
		timeout -= 1;
		return;
	}

	if (frameCount == 0) console.log(scrollSpeed);

	offset += offsetDir * (scrollSpeed ?? 0);
	if (offset < 0) {
		timeout = pauseDuration;
		offset = 0;
		offsetDir *= -1;
	}
	if (offset > infoHeight - HM) {
		timeout = pauseDuration;
		offset = max(0, infoHeight - HM);
		offsetDir *= -1;
	}
}

function loadChallengeSettingFromCode(code) {
	console.log('1', code);
	if (typeof code === 'string' || code instanceof String) code = JSON.parse(code);
	console.log('2', code);

	title = code?.title ?? '';
	startDate = code?.startDate ?? '';
	scrollSpeed = code?.scrollSpeed ?? 0.25;
	pauseDuration = code?.pauseDuration ?? 300;
	challenges = code?.challenges ?? [];
}
