const W = 500;
const HT = 90;
const HM = 400;
const HL = 5;
const HB = 105;
let offsetDir = 1;
let pauseSlider;
let speedSlider;

let currentID = 0;

let title;
let startDate;
let challenges;
let info;
let infoHeight;
let offset = 0;
let timeout = 0;

function setup() {
	const bUpdatePanel = select('#updatePanel');
	const bAddChallenge = select('#addChallenge');
	const bClear = select('#clearAll');
	const bExport = select('#exportCode');
	const bImport = select('#importCode');
	const iChallengeCode = select('#iChallengeCode');
	const iTitle = select('#iTitle');
	const iStartDate = select('#iStartDate');
	const challengeTBody = select('#challenges>tBody').elt;
	const settingsTBody = select('#settings>tBody').elt;

	speedSlider = select('#iScrollSpeed').elt;
	pauseSlider = select('#iPauseDuration').elt;

	speedSlider.value = 0.25;
	pauseSlider.value = 300;

	const params = getURLParams();
	if (params.code) {
		params.code = decodeURI(params.code);
		loadChallengeSettingFromCode(iTitle, iStartDate, challengeTBody, params.code, true);
	} else {
		title = getItem('title') || '';
		startDate = getItem('startDate') || '';
		challenges = getItem('challenges') || [];
		speedSlider.value = getItem('scrollSpeed') || 0.25;
		pauseSlider.value = getItem('pauseDuration') || 300;
		if (title && startDate && challenges) loadChallengeSettingFromCode(iTitle, iStartDate, challengeTBody, { title, startDate, challenges });
	}

	bUpdatePanel.mousePressed(() => loadChallengeSettingIntoInfo(iTitle, iStartDate));

	bAddChallenge.mousePressed(() => {
		let challengeID;
		do {
			challengeID = '-id-' + currentID++;
		} while (select('.' + challengeID));

		addChallengeSetting(challengeTBody, challengeID);
	});

	bClear.mousePressed(() => {
		iTitle.value('');
		iStartDate.value('');
		while (challengeTBody.firstChild) challengeTBody.removeChild(challengeTBody.lastChild);
	});

	bExport.mousePressed(() => {
		iChallengeCode.value(JSON.stringify({ title, startDate, challenges }));
	});

	bImport.mousePressed(() => {
		loadChallengeSettingFromCode(iTitle, iStartDate, challengeTBody, iChallengeCode.value(), false);
	});

	createCanvas(W, HT + HL + HM + HL + HB - 15);

	info = createGraphics(W - 50, HM - 30);
	info.textAlign(LEFT, TOP);
	info.textSize(HT * 0.47);
	info.textLeading(HT * 0.52);
	info.textStyle(BOLD);
	info.stroke(0, 100);
	noStroke();
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
	textAlign(CENTER, CENTER);
	textSize(HT * 0.5);
	textStyle(BOLD);
	text(title || 'title', W / 2, HT / 2);

	let h = 0;
	info.clear();
	for (let i = 0; i < challenges.length; i++) {
		const challenge = challenges[i];
		if (challenge.finished) info.fill(100, 200, 100);
		else info.fill(235, 245, 255);

		let challengeInfo = challenge.name;
		if (challenge.current || challenge.total) challengeInfo += ' ' + challenge.current || 0;
		if (challenge.total) challengeInfo += '/' + challenge.total;

		info.text(challengeInfo, 0, h - offset, W - 50);

		h += HT * 0.52 + HT * 0.2;
		if (info.textWidth(challengeInfo) > W - 52) h += HT * 0.52;

		if (i + 1 == challenges.length) continue;
		info.fill(70, 85, 80, 100);
		info.rect(0, h - offset - HT * 0.19, W - 52, HL);
	}
	h -= HT * 0.28;
	infoHeight = h;
	image(info, 25, HT + 15);

	textAlign(CENTER, CENTER);
	textSize(HT * 0.5);
	if (startDate) {
		fill(235, 245, 255);
		const millis = Date.now() - new Date(startDate);
		const secs = Math.floor(millis / 1000);
		const mins = Math.floor(secs / 60);
		const hours = Math.floor(mins / 60);
		text(`${nf(hours, 2, 0)}:${nf(mins % 60, 2, 0)}:${nf(secs % 60, 2, 0)}`, W / 2, HT + HM + HL + HB / 2);
	} else {
		fill(163, 224, 201);
		text('00:00:00', W / 2, HT + HM + HL + HB / 2);
	}

	if (timeout > 0) {
		timeout -= 1;
		return;
	}

	offset += offsetDir * speedSlider.value;
	if (offset < 0) {
		timeout = pauseSlider.value;
		offset = 0;
		offsetDir *= -1;
	}
	if (offset > infoHeight - (HM - 30)) {
		timeout = pauseSlider.value;
		offset = max(0, infoHeight - (HM - 30));
		offsetDir *= -1;
	}
}

function mousePressed(evt) {
	const classList = evt.target.classList;
	if (classList.contains('cRemoveChallenge')) {
		const challenge = select('.challenge.' + classList[1]);
		challenge.remove();
	} else if (classList.contains('cMoveChallengeUp')) {
		const challengeIndex = findChallengeIndex(classList[1]);
		if (challengeIndex < 1) return;

		const challenge = select('.challenge.' + classList[1]);
		select('.challenge.' + challenges[challengeIndex - 1].id).elt.before(challenge.elt);

		const _c = challenges[challengeIndex];
		challenges[challengeIndex] = challenges[challengeIndex - 1];
		challenges[challengeIndex - 1] = _c;
	} else if (classList.contains('cMoveChallengeDown')) {
		const challengeIndex = findChallengeIndex(classList[1]);
		if (challengeIndex + 1 >= challenges.length) return;

		const challenge = select('.challenge.' + classList[1]);
		select('.challenge.' + challenges[challengeIndex + 1].id).elt.after(challenge.elt);

		const _c = challenges[challengeIndex];
		challenges[challengeIndex] = challenges[challengeIndex + 1];
		challenges[challengeIndex + 1] = _c;
	}
}

function loadChallengeSettingFromCode(iTitle, iStartDate, tBody, code, update) {
	if (typeof code === 'string' || code instanceof String) {
		code = JSON.parse(code);
	}

	if (update) {
		title = code.title;
		startDate = code.startDate;
		challenges = code.challenges;
	}

	iTitle.value(code.title);
	iStartDate.value(code.startDate);
	while (tBody.firstChild) tBody.removeChild(tBody.lastChild);
	for (const challenge of code.challenges) {
		addChallengeSetting(tBody, challenge.id, challenge.name, challenge.current, challenge.total, challenge.finished);
		const settings = getChallengeSetting(challenge.id);
		addSyncHandler(settings.iName, settings.iCurrent, settings.iTotal, settings.iFinished);
	}
}

function loadChallengeSettingIntoInfo(iTitle, iStartDate) {
	title = iTitle.value();
	startDate = iStartDate.value();

	challenges = [];
	const tChallenges = selectAll('.challenge');
	for (const tChallenge of tChallenges) {
		const challengeID = tChallenge.elt.classList[1];
		const { iName, iCurrent, iTotal, iFinished } = getChallengeSetting(challengeID);
		addChallengeInfo(iName, iCurrent, iTotal, iFinished, challengeID);
	}

	storeItem('title', title);
	storeItem('startDate', startDate);
	storeItem('challenges', challenges);
	storeItem('scrollSpeed', speedSlider.value);
	storeItem('pauseDuration', pauseSlider.value);
}

function addChallengeSetting(tBody, challengeID, name, current, total, finished) {
	const tdName = document.createElement('td');
	const iName = document.createElement('input');
	iName.setAttribute('type', 'text');
	iName.className = 'cName ' + challengeID;
	if (name) iName.setAttribute('value', name.replaceAll(/\n/g, '\\n'));
	const tdCurrent = document.createElement('td');
	const iCurrent = document.createElement('input');
	iCurrent.setAttribute('type', 'number');
	iCurrent.className = 'cCurrent ' + challengeID;
	if (current) iCurrent.setAttribute('value', current);
	const tdTotal = document.createElement('td');
	const iTotal = document.createElement('input');
	iTotal.setAttribute('type', 'number');
	iTotal.className = 'cTotal ' + challengeID;
	if (total) iTotal.setAttribute('value', total);
	const tdFinished = document.createElement('td');
	const iFinished = document.createElement('input');
	iFinished.setAttribute('type', 'checkbox');
	iFinished.className = 'cFinished ' + challengeID;
	if (finished) iFinished.setAttribute('checked', '');
	const tdMoveUp = document.createElement('td');
	const iMoveUp = document.createElement('input');
	iMoveUp.setAttribute('type', 'button');
	iMoveUp.className = 'cMoveChallengeUp ' + challengeID;
	iMoveUp.setAttribute('value', '↑');
	const tdMoveDown = document.createElement('td');
	const iMoveDown = document.createElement('input');
	iMoveDown.setAttribute('type', 'button');
	iMoveDown.className = 'cMoveChallengeDown ' + challengeID;
	iMoveDown.setAttribute('value', '↓');
	const tdRemove = document.createElement('td');
	const iRemove = document.createElement('input');
	iRemove.setAttribute('type', 'reset');
	iRemove.className = 'cRemoveChallenge ' + challengeID;
	iRemove.setAttribute('value', 'x');

	tdName.appendChild(iName);
	tdCurrent.appendChild(iCurrent);
	tdTotal.appendChild(iTotal);
	tdFinished.appendChild(iFinished);
	tdMoveUp.appendChild(iMoveUp);
	tdMoveDown.appendChild(iMoveDown);
	tdRemove.appendChild(iRemove);

	const trChallenge = document.createElement('tr');
	trChallenge.classList = 'challenge ' + challengeID;

	trChallenge.appendChild(tdName);
	trChallenge.appendChild(tdCurrent);
	trChallenge.appendChild(tdTotal);
	trChallenge.appendChild(tdFinished);
	trChallenge.appendChild(tdMoveUp);
	trChallenge.appendChild(tdMoveDown);
	trChallenge.appendChild(tdRemove);

	tBody.appendChild(trChallenge);
}

function addChallengeInfo(iName, iCurrent, iTotal, iFinished, challengeID) {
	const name = iName.value.replaceAll('\\n', '\n');
	const current = Number(iCurrent.value);
	const total = Number(iTotal.value);
	const finished = iFinished.checked || false;
	challenges.push({ id: challengeID, name, current, total, finished });
}

function getChallengeSetting(challengeID) {
	const iName = select('.cName.' + challengeID).elt;
	const iCurrent = select('.cCurrent.' + challengeID).elt;
	const iTotal = select('.cTotal.' + challengeID).elt;
	const iFinished = select('.cFinished.' + challengeID).elt;

	return { iName, iCurrent, iTotal, iFinished };
}

function findChallengeIndex(challengeID) {
	for (let i = 0; i < challenges.length; i++) {
		if (challenges[i].id == challengeID) return i;
	}
	return -1;
}
