import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { CourseStatisticsDataSet } from 'app/overview/course-statistics/course-statistics.component';
import { ChartType, registerables } from 'chart.js';
import { round } from 'app/shared/util/utils';
import { DoughnutChartType } from './course-detail.component';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(...registerables);
Chart.register(ChartDataLabels);
Chart.register(annotationPlugin);
Chart.defaults.plugins.datalabels!.display = false;

@Component({
    selector: 'jhi-course-detail-doughnut-chart',
    templateUrl: './course-detail-doughnut-chart.component.html',
    styleUrls: ['./course-detail-doughnut-chart.component.scss'],
})
export class CourseDetailDoughnutChartComponent implements OnChanges, OnInit {
    @Input() courseId: number;
    @Input() contentType: DoughnutChartType;
    @Input() currentPercentage: number | undefined;
    @Input() currentAbsolute: number | undefined;
    @Input() currentMax: number | undefined;

    receivedStats = false;
    doughnutChartTitle: string;
    stats: number[];
    titleLink: string | undefined;

    constructor(private router: Router) {}

    // Chart.js data
    doughnutChartType: ChartType = 'doughnut';
    doughnutChartColors: any[] = ['limegreen', 'red'];
    doughnutChartLabels: string[] = ['Done', 'Not Done'];
    totalScoreOptions: any = {
        cutout: '75%',
        responsive: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 1)',
                callbacks: {
                    label(context: any) {
                        if (context && context['dataset'] && context['dataset'] && context['dataset']['data']) {
                            const value = context['dataset']['data'][context['dataIndex']];
                            return '' + (value === -1 ? 0 : value);
                        }
                    },
                },
            },
        },
    };
    doughnutChartData: CourseStatisticsDataSet[] = [
        {
            data: [0, 0],
            backgroundColor: this.doughnutChartColors,
        },
    ];

    ngOnChanges(): void {
        // [0, 0] will lead to the chart not being displayed,
        // assigning [-1, 0] works around this issue and displays 0 %, 0 / 0 with a green circle
        if (this.currentAbsolute == undefined && !this.receivedStats) {
            this.doughnutChartData[0].data = [-1, 0];
        } else {
            this.receivedStats = true;
            const remaining = round(this.currentMax! - this.currentAbsolute!, 1);
            this.stats = [this.currentAbsolute!, remaining];
            this.doughnutChartData[0].data = this.currentMax === 0 ? [-1, 0] : this.stats;
        }
    }

    /**
     * Depending on the information we want to display in the doughnut chart, we need different titles and links
     */
    ngOnInit(): void {
        switch (this.contentType) {
            case DoughnutChartType.ASSESSMENT:
                this.doughnutChartTitle = 'assessments';
                this.titleLink = 'assessment-dashboard';
                break;
            case DoughnutChartType.COMPLAINTS:
                this.doughnutChartTitle = 'complaints';
                this.titleLink = 'complaints';
                break;
            case DoughnutChartType.FEEDBACK:
                this.doughnutChartTitle = 'moreFeedback';
                this.titleLink = undefined;
                break;
            case DoughnutChartType.AVERAGE_COURSE_SCORE:
                this.doughnutChartTitle = 'averageStudentScore';
                this.titleLink = 'scores';
                break;
            default:
                this.doughnutChartTitle = '';
                this.titleLink = undefined;
        }
    }

    /**
     * handles clicks onto the graph, which then redirects the user to the corresponding page, e.g. complaints page for the complaints chart
     */
    openCorrespondingPage() {
        if (this.courseId && this.titleLink) {
            this.router.navigate(['/course-management', this.courseId, this.titleLink]);
        }
    }
}
