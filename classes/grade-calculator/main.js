const calculateButotn = document.getElementById("calculateButton")
const gradeFields = ["gradeOneInput", "gradeTwoInput", "gradeThreeInput", "gradeFourInput"]

function calculateGrade()
{
    let score = 0
    let finalResultSection = document.getElementById("finalResults")
    let finalResultsString = "<h2>"
    gradeFields.forEach(
        (item, index) =>
        {
            value = document.getElementById(item).value
            if (!isNaN(value))
            {
                score += +value
                console.log(value)
            }
        }
    )

    let finalScore = score/400*100
    finalResultsString += "Out of 400 your total is " + score + " and percentage is " + finalScore.toFixed(2) + "%.\n"

    let finalGrade = ""
    if (finalScore >= 85)
    {
        finalGrade = "A"
    } else if (finalScore >= 65)
    {
        finalGrade = "B"
    } else if (finalScore >= 50)
    {
        finalGrade = "C"
    } else
    {
        finalGrade = "F"
    }

    finalResultsString += "Your grade is " + finalGrade + ".</h2>"
    finalResultSection.innerHTML = finalResultsString
}

calculateButton.addEventListener("click", calculateGrade)
