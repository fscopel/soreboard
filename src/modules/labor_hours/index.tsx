import { LineChart } from '@mui/x-charts/LineChart';
import { ModuleWrapper } from '../../components/ModuleWrapper';

// Sample data for labor hours from 8am to 12pm
const timeValues = [8, 9, 10, 11, 12]; // Hour values for x-axis

// Sample data: Actual labor dollars (left y-axis)
const actualLaborDollars = [450, 520, 680, 750, 820];

// Sample data: Schedule labor dollars (right y-axis)
const scheduleLaborDollars = [400, 500, 600, 700, 800];

export const LaborHoursModule = () => {
  return (
    <ModuleWrapper title="Labor Hours - Actual vs Schedule">
      <div className="h-full w-full flex items-center justify-center">
        <LineChart
          width={undefined}
          height={400}
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
              min: 8,
              max: 12,
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
              data: actualLaborDollars,
              yAxisId: 'labor-dollars',
              color: '#1976d2',
              curve: 'linear',
            },
            {
              id: 'schedule',
              label: 'Schedule Labor Hours',
              data: scheduleLaborDollars,
              yAxisId: 'schedule-dollars',
              color: '#ed6c02',
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

