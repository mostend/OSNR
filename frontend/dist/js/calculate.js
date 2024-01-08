function watchStages(newStages, oldStages, Pin, const58) {
    for (var i = 0; i < newStages.length; i++) {
        var currentStage = newStages[i];
        if (i == 0) {
            fisrtStageCalculate(currentStage, Pin, const58)
        } else {
            stageCalculate(currentStage, i, newStages, Pin, const58)
        }
    }


    return newStages
}

function fisrtStageCalculate(Stage, Pin, const58) {
    // 计算Output
    Stage.Output = parseFloat(new Decimal(Stage.Input).plus(new Decimal(Stage.Gain)).sub(new Decimal(Stage.SpanLoss)))
    // 计算G_linear
    Stage.G_linear = parseFloat(new Decimal(10).pow(new Decimal(Stage.Gain / 10)).toString());
    // 计算L-linear
    Stage.L_linear = parseFloat(new Decimal(10).pow(new Decimal(-Stage.SpanLoss / 10)).toString());
    // 计算Delta_G*L
    Stage.Delta_GxL = parseFloat(new Decimal(Stage.G_linear).times(Stage.L_linear).toString());
    // 计算F_linear
    Stage.F_linear = parseFloat(new Decimal(10).pow(new Decimal(Stage.NF / 10)).toString());
    // 计算Fsys_linear
    Stage.Fsys_linear = Stage.F_linear
    // 计算Fsys
    Stage.Fsys = parseFloat(new Decimal(10) * Decimal.log10(Stage.Fsys_linear));
    // 计算OSNR 
    Stage.OSNR = parseFloat(
        new Decimal(Pin)
            .sub(new Decimal(Stage.Fsys))
            .sub(new Decimal(const58))
    ).toFixed(2)
}

function stageCalculate(Stage, currentIndex, newStages, Pin, const58) {
    // 计算Output
    let pervStage = newStages[currentIndex - 1]
    Stage.Input = pervStage.Output
    Stage.Output = parseFloat(new Decimal(Stage.Input).plus(new Decimal(Stage.Gain)).sub(new Decimal(Stage.SpanLoss)))
    // 计算G_linear
    Stage.G_linear = parseFloat(new Decimal(10).pow(new Decimal(Stage.Gain / 10)).toString());
    // 计算L-linear
    Stage.L_linear = parseFloat(new Decimal(10).pow(new Decimal(-Stage.SpanLoss / 10)).toString());
    // 计算Delta_G*L
    Stage.Delta_GxL = parseFloat(new Decimal(Stage.G_linear).times(Stage.L_linear).toString());
    // 计算F_linear
    Stage.F_linear = parseFloat(new Decimal(10).pow(new Decimal(Stage.NF / 10)).toString());
    // 计算Fsys_linear
    let totalF_linear = new Decimal(1)
    for (let j = 0; j < currentIndex; j++) {
        totalF_linear = totalF_linear * new Decimal(newStages[j].Delta_GxL)
    }
    Stage.Fsys_linear = parseFloat(
        new Decimal(pervStage.Fsys_linear)
            .plus(
                (new Decimal(Stage.F_linear).sub(new Decimal(pervStage.L_linear)))
                    .div(new Decimal(totalF_linear))
            )
    )
    // 计算Fsys
    Stage.Fsys = parseFloat(new Decimal(10) * Decimal.log10(Stage.Fsys_linear));
    // 计算OSNR 
    Stage.OSNR = parseFloat(
        new Decimal(Pin)
            .sub(new Decimal(Stage.Fsys))
            .sub(new Decimal(const58))
    ).toFixed(2)
}

function calculateTotalLinearCascadeNoise(finalStages) {
    if (finalStages.length > 0) {
        let totalLinearCascadeNoise = finalStages[finalStages.length - 1].Fsys_linear.toFixed(2)
        return totalLinearCascadeNoise
    }
}

function calculateTotalCascadeNoise(finalStages) {
    let totalLinearCascadeNoise = calculateTotalLinearCascadeNoise(finalStages)
    if (finalStages.length == 0) {
        return 0
    }
    let totalCascadeNoise = parseFloat(new Decimal(10) * Decimal.log10(totalLinearCascadeNoise)).toFixed(2)
    return totalCascadeNoise
}

function calculateTotalDistace(finalStages) {
    let distance = new Decimal(0)
    for (let i = 0; i < finalStages.length; i++) {
        let stage = finalStages[i]
        distance = distance.plus(new Decimal(stage.Distance))
    }

    return distance
}


function downloadJson(fileName, json) {
    const jsonStr = (json instanceof Object) ? JSON.stringify(json) : json;
    const url = window.URL || window.webkitURL || window;
    const blob = new Blob([jsonStr]);
    const saveLink = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
    saveLink.href = url.createObjectURL(blob);
    saveLink.download = fileName;
    saveLink.click();
}

function formatDate() {
    timer = new Date()
    const year = timer.getFullYear()
    const month = timer.getMonth() + 1
    const day = timer.getDate()
    const hour = timer.getHours()
    const minute = timer.getMinutes()
    const second = timer.getSeconds()
    return `${year}-${month}-${day}-${hour}-${minute}-${second}`
}

function echart(y, x, fileName) {
    var dom = document.getElementById('chart');
    var myChart = echarts.init(dom, null, {
        renderer: 'canvas',
        useDirtyRect: false
    });
    var option;

    option = {
        title: {
            left: 'center'
        },
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['OSNR']
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        toolbox: {
            feature: {
                saveAsImage: {
                    name: fileName,
                }
            }
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: x
        },
        yAxis: {
            type: 'value',
            alignTicks: true,
            interval: 2,
        },
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>Stage{b} : {c}'
        },
        series: [
            {
                name: "OSNR",
                data: y,
                type: 'line',
                smooth: true
            }
        ]
    };

    option && myChart.setOption(option);

    window.addEventListener('resize', myChart.resize);
}