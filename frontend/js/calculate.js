
const MIN_INPUT = -40

function formatDate() {
    timer = new Date()
    const year = timer.getFullYear()
    const month = timer.getMonth() + 1
    const day = timer.getDate()
    const hour = timer.getHours()
    const minute = timer.getMinutes()
    const second = timer.getSeconds()
    return `${year}_${month}_${day}-${hour}_${minute}_${second}`
}

function CalculateMUXSingleWavelengthOutputPower(newUserInput) {
    let nas = math.evaluate(`${newUserInput.InputPower} -  ${newUserInput.MuxDemuxLoss}`)
    return math.format(nas, { precision: 4 })
}

function CalculateMUXMultiWavelengthOutputPower(newUserInput) {
    let nas = math.evaluate(`${newUserInput.InputPower} + 10*log10(${newUserInput.MuxDemuxChannels}) -  ${newUserInput.MuxDemuxLoss}`)
    return math.format(nas, { precision: 4 })
}

function CalculateWavelength2ChannelFrequency(wavelength) {
    let nas = math.evaluate(`2.99792458 * 10e17 / ${wavelength} * 10e-14`)
    return math.format(nas, { precision: 5 })
}

function CalculateChannelFrequency2Wavelength(channelFrequency) {
    let nas = math.evaluate(`2.99792458 * 10e17 / ${channelFrequency} * 10e-14`)
    return math.format(nas, { precision: 7 })
}

function CalculateSpanLoss2Distance(spanLoss, fiberLoss) {
    let nas = math.evaluate(`${spanLoss} / ${fiberLoss}`)
    return math.format(nas, { precision: 4 })
}

function CalculateDistance2SpanLoss(distance, fiberLoss) {
    let nas = math.evaluate(`${distance} * ${fiberLoss}`)
    return math.format(nas, { precision: 4 })
}

function Calculate58(PlanckConstant, Frequency, EffectiveBandwidthFrequency) {
    let nas = math.evaluate(`10*log10(${PlanckConstant} * ${Frequency} * ${EffectiveBandwidthFrequency} * 10^(12+12-31))`)
    return math.format(nas, { precision: 4 })
}

function CalculateOutputPower(input, gain, spanLoss) {
    let nas = math.evaluate(`${input} + ${gain} - ${spanLoss}`)
    return math.format(nas, { precision: 4 })
}

function CalculateFinalOSNR(osnr, margin) {
    if (osnr == 0) {
        return 0
    }
    let nas = math.evaluate(`${osnr} - ${margin}`)
    return math.format(nas, { precision: 4 })
}

function CalculateTotalDistance(finalStages) {
    let distance = 0
    for (let i = 0; i < finalStages.length; i++) {
        let stage = finalStages[i]
        distance = math.evaluate(`${distance} + ${stage.Distance}`)
    }
    return math.format(distance, { precision: 5 })
}

function CalculateTotalLinearCascadeNoise(finalStages) {
    if (finalStages.length > 0) {
        let totalLinearCascadeNoise = finalStages[finalStages.length - 1].Fsys_linear
        let nas = math.evaluate(`0 + ${totalLinearCascadeNoise}`)
        return math.format(nas, { precision: 4 })
    }
}

function CalculateTotalCascadeNoise(finalStages) {
    let totalLinearCascadeNoise = CalculateTotalLinearCascadeNoise(finalStages)
    if (finalStages.length == 0 || totalLinearCascadeNoise == 0) {
        return 0
    }
    let totalCascadeNoise = 0
    totalCascadeNoise = math.evaluate(`10 * log10(${totalLinearCascadeNoise})`)
    return math.format(totalCascadeNoise, { precision: 4 })
}



function watchStages(newStages, oldStages, InputPower, const58) {
    for (var i = 0; i < newStages.length; i++) {
        var currentStage = newStages[i];
        if (i == 0) {
            fisrtStageCalculate(currentStage, InputPower, const58)
        } else {
            stageCalculate(currentStage, i, newStages, InputPower, const58)
        }
    }
    return newStages
}


function fisrtStageCalculate(currentStage, InputPower, const58) {
    // 计算Output
    let output = math.evaluate(`${InputPower} + ${currentStage.Gain} - ${currentStage.SpanLoss}`)
    currentStage.Output = math.format(output, { precision: 4 })
    // 如果光功率小于-40dBm, 线路劣化，直接返回0
    if (currentStage.Input <= MIN_INPUT) {
        currentStage.OSNR = 0
        currentStage.Fsys_linear = 0
        return
    }

    // 计算G_linear
    let g_linear = math.evaluate(`10^(${currentStage.Gain} / 10)`)
    currentStage.G_linear = math.format(g_linear, { precision: 14 })
    // 计算L-linear
    let l_linear = math.evaluate(`10^(0 - ${currentStage.SpanLoss} / 10)`)
    currentStage.L_linear = math.format(l_linear, { precision: 14 })
    // // 计算Delta_G*L
    let delta_gxl = math.evaluate(`${currentStage.G_linear} * ${currentStage.L_linear}`)
    currentStage.Delta_GxL = math.format(delta_gxl, { precision: 14 })
    // // 计算F_linear
    let f_linear = math.evaluate(`10^(${currentStage.NF} / 10)`)
    currentStage.F_linear = math.format(f_linear, { precision: 14 })
    // // 计算Fsys_linear
    currentStage.Fsys_linear = currentStage.F_linear
    // // 计算Fsys
    let fsys = math.evaluate(`10 * log10(${currentStage.Fsys_linear})`)
    currentStage.Fsys = math.format(fsys, { precision: 14 })
    // // 计算OSNR 
    let osnr = math.evaluate(`${InputPower} - ${currentStage.Fsys} - ${const58}`)
    currentStage.OSNR = math.format(osnr, { precision: 4 })
}

function stageCalculate(currentStage, currentIndex, newStages, InputPower, const58) {
    // 计算Input,从上一个节点的Output获取
    let pervStage = newStages[currentIndex - 1]
    currentStage.Input = pervStage.Output

    // 计算Output
    let output = math.evaluate(`${currentStage.Input} + ${currentStage.Gain} - ${currentStage.SpanLoss}`)
    currentStage.Output = math.format(output, { precision: 4 })

    // 如果光功率小于-40dBm, 线路劣化，直接返回0
    if (pervStage.Output <= MIN_INPUT) {
        currentStage.OSNR = 0
        currentStage.Fsys_linear = 0
        return
    }

    // // 计算G_linear
    let g_linear = math.evaluate(`10^(${currentStage.Gain} / 10)`)
    currentStage.G_linear = math.format(g_linear, { precision: 14 })

    // // 计算L-linear
    let l_linear = math.evaluate(`10^(0 - ${currentStage.SpanLoss} / 10)`)
    currentStage.L_linear = math.format(l_linear, { precision: 14 })

    // // 计算Delta_G*L
    let delta_gxl = math.evaluate(`${currentStage.G_linear} * ${currentStage.L_linear}`)
    currentStage.Delta_GxL = math.format(delta_gxl, { precision: 14 })
    // // 计算F_linear
    let f_linear = math.evaluate(`10^(${currentStage.NF} / 10)`)
    currentStage.F_linear = math.format(f_linear, { precision: 14 })

    // // 计算Fsys_linear
    let totalF_linear = 1
    for (let j = 0; j < currentIndex; j++) {
        let temp = math.evaluate(`${totalF_linear} * ${newStages[j].Delta_GxL}`)
        totalF_linear = math.format(temp, { precision: 14 })
    }

    let fsys_linear = math.evaluate(`${pervStage.Fsys_linear} + ((${currentStage.F_linear} - ${pervStage.L_linear})*${totalF_linear})`)
    currentStage.Fsys_linear = math.format(fsys_linear, { precision: 14 })

    // // 计算Fsys
    let fsys = math.evaluate(`10 * log10(${currentStage.Fsys_linear})`)
    currentStage.Fsys = math.format(fsys, { precision: 14 })
    // // 计算OSNR 
    let osnr = math.evaluate(`${InputPower} - ${currentStage.Fsys} - ${const58}`)
    currentStage.OSNR = math.format(osnr, { precision: 4 })

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