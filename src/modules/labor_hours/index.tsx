import { LineChart } from '@mui/x-charts/LineChart';
import { ModuleWrapper } from '../../components/ModuleWrapper';

// Sample data for labor hours from 11am to 11pm
const timeValues = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 20.25, 21, 22, 23]; // Hour values for x-axis, 20.25 = 8:15pm

// Sample data: Actual labor dollars (left y-axis)
// After 8pm (20:00), actual exceeds scheduled by 100
const actualLaborDollars = [500, 550, 600, 650, 700, 720, 750, 800, 850, 900, 900, 1000, 980, 940];

// Sample data: Schedule labor dollars (right y-axis)
// Peak at 7pm (hour 19)
const scheduleLaborDollars = [480, 520, 580, 640, 700, 740, 780, 820, 900, 820, 820, 780, 720, 680];

// Historical sales data (higher than scheduled)
// Peak at 8pm (hour 20, index 9)
const historicalSalesDollars = [550, 600, 680, 750, 820, 850, 880, 950, 1000, 1100, 1100, 1050, 980, 920];

// Split actual labor data: normal (blue) from 11am-6pm, red (red) from 7pm-11pm
const createActualDataSeries = () => {
  const normalData: (number | null)[] = [];
  const redData: (number | null)[] = [];
  
  actualLaborDollars.forEach((actual, index) => {
    // 7pm is at index 8 (hour 19 - 11 = 8)
    if (index >= 8) {
      normalData.push(null);
      redData.push(actual);
    } else {
      normalData.push(actual);
      redData.push(null);
    }
  });
  
  return { normalData, redData };
};

export const LaborHoursModule = () => {
  const { normalData, redData } = createActualDataSeries();
  return (
    <ModuleWrapper title="Labor Hours - Actual vs Schedule">
      <div className="h-full w-full flex items-center justify-center">
        <LineChart
          width={undefined}
          sx={{ width: '100%', maxWidth: '100%' }}
          xAxis={[
            {
              data: timeValues,
              valueFormatter: (value) => {
                const hour = Math.floor(value);
                const period = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                return `${displayHour}:00 ${period}`;
              },
              label: 'Time',
              min: 11,
              max: 23,
            },
          ]}
          yAxis={[
            {
              id: 'labor-dollars',
              label: 'Labor Dollars ($)',
              position: 'left',
            },
            {
              id: 'schedule-dollars',
              label: 'Schedule Dollars ($)',
              position: 'right',
            },
          ]}
          series={[
            {
              id: 'actual',
              label: 'Actual Labor Hours',
              data: normalData,
              yAxisId: 'labor-dollars',
              color: '#1976d2',
              curve: 'linear',
              connectNulls: true,
            },
            {
              id: 'actual-red',
              label: 'Actual Labor Hours (7pm-11pm)',
              data: redData,
              yAxisId: 'labor-dollars',
              color: '#d32f2f',
              curve: 'linear',
              connectNulls: true,
              showMark: false,
            },
            {
              id: 'schedule',
              label: 'Schedule Labor Hours',
              data: scheduleLaborDollars,
              yAxisId: 'schedule-dollars',
              color: '#ed6c02',
              curve: 'linear',
            },
            {
              id: 'historical-sales',
              label: 'Historical Sales',
              data: historicalSalesDollars,
              yAxisId: 'schedule-dollars',
              color: '#fdd835',
              curve: 'linear',
            },
          ]}
          grid={{ vertical: true, horizontal: true }}
          slotProps={{
            legend: {
              direction: 'row',
              position: { vertical: 'top', horizontal: 'middle' },
            },
          }}
        />
      </div>
    </ModuleWrapper>
  );
};

