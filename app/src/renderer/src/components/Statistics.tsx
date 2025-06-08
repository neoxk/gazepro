import { JSX } from "react";

import { Bar } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
} from 'chart.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

interface ResponseEntry {
    expected: number
    actual: number
    label: string
    series: number
    position: string
}

interface StatsProps {
    responses: ResponseEntry[]
}

export const Statistics = ({ responses }: StatsProps) : JSX.Element => {
    const totalCorrect = responses.filter(r => r.expected === r.actual).length
    const totalIncorrect = responses.length - totalCorrect

    const overallData = {
        labels: ['Snippets'],
        datasets: [
        {
            label: 'Correct',
            data: [totalCorrect],
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
        {
            label: 'Incorrect',
            data: [totalIncorrect],
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
        },
        ],
    }

    const grouped = responses.reduce((acc, r) => {
        if (!acc[r.series]) acc[r.series] = []
        acc[r.series].push(r)
        return acc
    }, {} as Record<number, ResponseEntry[]>)

    return (
    <div className="my-5">
        <h3 className="text-center mb-4">Overall Accuracy</h3>
        <div style={{ maxWidth: '700px', margin: 'auto' }}>
            <Bar data={overallData} />
        </div>

        <hr className="my-5" />

        <div className="row">
            {Object.entries(grouped).map(([seriesNum, group]) => {
                const labels = Array.from(new Set(group.map(r => r.label)))
                const correct = labels.map(l =>
                    group.filter(r => r.label === l && r.expected === r.actual).length
                )
                const incorrect = labels.map(l =>
                    group.filter(r => r.label === l && r.expected !== r.actual).length
                )

                return (
                    <div key={seriesNum} className="col-md-6 my-4">
                        <h5 className="text-center">Series {seriesNum}</h5>
                        <div style={{ maxWidth: '700px', margin: 'auto' }}>
                            <Bar
                                data={{
                                    labels,
                                    datasets: [
                                    {
                                        label: 'Correct',
                                        data: correct,
                                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                                    },
                                    {
                                        label: 'Incorrect',
                                        data: incorrect,
                                        backgroundColor: 'rgba(255, 159, 64, 0.6)',
                                    },
                                    ],
                                }}
                            />
                        </div>
                    </div>
                )
            })}
        </div>
    </div>
  )
}