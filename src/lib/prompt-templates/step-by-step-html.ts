export default `<section class="step-by-step">
    <div class="step">
        <p class="step-description">…</p>
        <p class="step-question">…</p>
        <div class="step-question-choices">
            <label for="q#o1" class="step-question-choice" data-type="correct">
                <input id="q#o1" name="question#" type="radio" class="step-question-radio">
                <div class="step-question-choice-content">…</div>
                <p class="answer-explanation">… (explain why this is correct)</p>
            </label>
            <hr class="divider">
            <label for="q#o2" class="step-question-choice">
                <input id="q#o2" name="question#" type="radio" class="step-question-radio">
                <div class="step-question-choice-content">…</div>
                <p class="answer-explanation">… (explain why this is wrong)</p>
            </label>
            <hr class="divider">
            (repeat for other answer options without the hr after the last option, using "o#" for ids)
            (make sure to not always make the correct answer first)
            (exactly one option per question gets data-type="correct"; every other option must be genuinely wrong)
            (no two options may be equivalent, e.g. the same expression written differently or rewritten with a substitution; if an option is equivalent to the correct one, replace it with a different wrong answer)
            (each explanation must agree with how its option is marked: never explain a wrong option as if it were correct)
    </div>
    <hr class="divider">
    (repeat for questions 2 and 3 with different question numbers)
</section>`
