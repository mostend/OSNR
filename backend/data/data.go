package data

import "time"

type OSNRData struct {
	PorjectName                  string
	CreateAt                     time.Time
	Pin                          float64
	CascadeNoise                 float64
	LinearCascadeNoise           float64
	FiberLoss                    float64
	MarginOSNR                   float64
	FinalOSNR                    float64
	PlanckConstant               float64
	Wavelength                   float64
	Frequency                    float64
	EffectiveBandwidthWavelength float64
	EffectiveBandwidthFrequency  float64
	TotalDistance                float64
	EDFATypes                    []string
	LossTypes                    []string
	Stages                       []Stage
}

type Stage struct {
	EDFAType    string
	Gain        float64
	LossType    string
	SpanLoss    float64
	Distance    float64
	NF          float64
	Input       float64
	Output      float64
	G_linear    float64
	L_linear    float64
	Delta_GxL   float64
	F_linear    float64
	Fsys_linear float64
	Fsys        float64
	OSNR        float64
	SiteName    string
}
