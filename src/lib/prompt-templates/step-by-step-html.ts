export default `<section class="step-by-step">
    <div class="step">
        <p class="step-description">…</p>
        <p class="step-question">…</p>
        <div class="step-question-choices">
            <label for="q#o1" class="step-question-choice correct">
                <input id="q#o1" name="question#" type="radio" class="step-question-radio correct">
                <div class="step-question-choice-content">…</div>
            </label>
            <hr class="divider">
            (repeat for other answer options without the hr after the last option but instrad of "o1" use "o#")
            (make sure to not always make the correct question as the first)
        </div>
        <p class="correct-explanation">…</p>
    </div>
    <hr class="divider">
    (repeat for questions 2 and 3 with different question numbers)
</section>`