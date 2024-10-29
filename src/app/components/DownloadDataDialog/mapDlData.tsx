import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { MapState } from '../../pages/MapPage/slice/types';
import {
  Box,
  Typography,
  Slider,
  Skeleton,
  Input as MuiInput,
  TextField,
  Button,
  MenuItem,
  Select,
  Modal,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  MapDataSectionTextStyle,
  MapDataValueTextStyle,
  YearsSliderStyle,
  FieldContainerStyle,
  ImgButtonContainerStyle,
  ImgDoubleButtonContainerStyle,
  MapDataContainerStyle,
  SliderContainerStyle,
  InputYearStyle,
  FieldsStyle,
  RowStyle,
  MapColStyle,
  FullWidthStyle,
} from './styles';
import { DownloadMap } from './DownloadMap';
import { roundTo4 } from '../../../utils/json_manipulations';
import { LatLngBounds } from 'leaflet';

import { RequestApi } from 'app/Services';
//import Select from 'react-select';

export function range(stop: number): number[];
export function range(start: number, stop: number, step?: number): number[];
export function range(
  startOrStop: number,
  stop?: number,
  step: number = 1,
): number[] {
  if (step === 0) {
    throw new RangeError('Parameter step must be different from 0');
  }
  const startBound = stop === undefined ? 0 : startOrStop;
  const stopBound = stop === undefined ? startOrStop : stop;
  return Array.from(
    { length: Math.ceil((stopBound - startBound) / step - 1) + 1 },
    (_, index) => startBound + index * step,
  );
}

export interface MapDlDataProps {
  // getMapImg: Function;
  onChange?: (values: any) => void;
  configuration: any;
  menus: any;
}

const MapDlData = (props: MapDlDataProps) => {
  const attributes: any = props.menus;
  const onChange = props.onChange ?? (() => { });
  const configuration = props.configuration;
  const featureGroupRef: any = useRef();
  const { t, i18n } = useTranslation();

  //@ts-ignore
  const { selected_map, forecast_parameters, timeserie } = useSelector(
    state => (state as any)?.map as MapState,
  );

  const mapBounds = [
    [selected_map.bbox[1][1], selected_map.bbox[0][1]],
    [selected_map.bbox[1][0], selected_map.bbox[0][0]],
  ];
  const [downLoadBounds, setDownLoadBounds] = React.useState(mapBounds);
  const [showReset, setShowReset] = React.useState(false);

  const resetBounds = () => {
    setDownLoadBounds(mapBounds);
    featureGroupRef?.current?.clearLayers();
  };

  const changeBounds = bounds => {
    setDownLoadBounds(bounds);
    JSON.stringify(bounds) !== JSON.stringify(mapBounds)
      ? setShowReset(true)
      : setShowReset(false);
  };

  const setBoundsFromMap = (bounds: LatLngBounds) => {
    changeBounds([
      [
        bounds.getSouth().toFixed(3), //south
        bounds.getWest().toFixed(3), //west
      ],
      [
        bounds.getNorth().toFixed(3), // north
        bounds.getEast().toFixed(3), // east
      ],
    ]);
  };

  const times: number[] = range(1979, 2100, 1); // timeserie ? timeserie[0].values.map(v => v.time) : [];

  const [years, setYears] = React.useState<number[]>([0, times.length - 1]);

  // const [netCdf, setNetCdf] = React.useState<any>(null);

  const yearsHandleChange = (event, newValue: number | number[]) => {
    setYears(newValue as number[]);
  };

  const findValueName = (key: string, listKey: string) => {
    const id = selected_map[key];
    let name = '';
    if (id)
      name = forecast_parameters[listKey]?.find(item => item.id === id)?.name;
    return name ?? '';
  };

  const joinNames = (names: string[]) => names.filter(name => name).join(' - ');

  React.useEffect(() => {
    const values = {};
    values['time_start'] = times[years[0]];
    values['time_end'] = times[years[1]];
    onChange(values);
  }, [onChange]);

  React.useEffect(() => {
    const values = {};
    values['north'] = parseFloat(downLoadBounds[1][0]);
    values['south'] = parseFloat(downLoadBounds[0][0]);
    values['east'] = parseFloat(downLoadBounds[1][1]);
    values['west'] = parseFloat(downLoadBounds[0][1]);
    onChange(values);
  }, [downLoadBounds, onChange]);

  const getOptions = field => {
    let x = attributes.filter(x => x.name === field);
    if (x) {
      return x[0].allowed_values.map(xx => {
        return {
          value: xx.name,
          label:
            i18n.language === 'it'
              ? xx.display_name_italian
              : xx.display_name_english,
        };
      });
    }
    return {};
  };

  return (
    <Box sx={MapDataContainerStyle}>
      <Box sx={FieldsStyle}>
        <Box sx={RowStyle}>
          {/*Column1*/}
          <Box sx={FieldContainerStyle}>
            <Typography variant={'h6'} sx={MapDataSectionTextStyle}>
              {t('app.map.downloader.indicator')}
            </Typography>
            <Select
              sx={FullWidthStyle}
              defaultValue={configuration.climatological_variable}
              name="climatological_variable"
            >
              {getOptions('climatological_variable').map(item => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
        <Box sx={RowStyle}>
          <Box>
            <Box sx={FieldContainerStyle}>
              <Typography variant={'h6'} sx={MapDataSectionTextStyle}>
                {t('app.map.downloader.model')}
              </Typography>
              <Select
                sx={FullWidthStyle}
                defaultValue={[configuration.climatological_model]}
                multiple
                name="climatological_model"
              >
                {getOptions('climatological_model').map(item => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Box>
          <Box sx={FieldContainerStyle}>
            <Typography variant={'h6'} sx={MapDataSectionTextStyle}>
              {t('app.map.downloader.scenario')}
            </Typography>
            <Select
              sx={FullWidthStyle}
              defaultValue={[configuration.scenario]}
              multiple
              name="scenario"
            >
              {getOptions('scenario').map(item => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
        <Box sx={RowStyle}>
          <Box sx={FieldContainerStyle}>
            <Typography variant={'h6'} sx={MapDataSectionTextStyle}>
              {t('app.map.downloader.average')}
            </Typography>
            <Select
              sx={FullWidthStyle}
              defaultValue={configuration.aggregation_period}
              name="aggregation_period"
            >
              {getOptions('aggregation_period').map(item => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={FieldContainerStyle}>
            <Typography variant={'h6'} sx={MapDataSectionTextStyle}>
              {t('app.map.downloader.measure')}
            </Typography>
            <Select
              sx={FullWidthStyle}
              defaultValue={configuration.measure}
              name="measure"
            >
              {getOptions('measure').map(item => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={FieldContainerStyle}>
            <Typography variant={'h6'} sx={MapDataSectionTextStyle}>
              {t('app.map.downloader.quantity')}
            </Typography>
            <Select
              sx={FullWidthStyle}
              disabled={configuration.aggregation_period !== '30yr'}
              defaultValue={configuration.time_window}
              name="time_window"
            >
              {getOptions('time_window').map(item => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
        <Box sx={RowStyle}>
          <Box sx={FieldContainerStyle}>
            <Typography variant={'h6'} sx={MapDataSectionTextStyle}>
              {t('app.map.downloader.season')}
            </Typography>
            <Select
              sx={FullWidthStyle}
              defaultValue={configuration.year_period}
              name="year_period"
            >
              {getOptions('year_period').map(item => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
      </Box>

      <Box sx={MapColStyle}>
        {/*Column2*/}
        <Box sx={FieldContainerStyle}>
          <DownloadMap
            mapBounds={mapBounds}
            downLoadBounds={downLoadBounds}
            featureGroupRef={featureGroupRef}
            setBoundsFromMap={setBoundsFromMap}
            resetBounds={resetBounds}
          />
          <Box sx={ImgButtonContainerStyle}>
            <TextField
              id="outlined-number"
              label={t('app.map.downloadDataDialog.map.west')}
              type="number"
              value={downLoadBounds[0][1]}
              onChange={e => {
                changeBounds([
                  [
                    downLoadBounds[0][0],
                    Number(e.target.value.replace(',', '.')),
                  ],
                  [downLoadBounds[1][0], downLoadBounds[1][1]],
                ]);
              }}
              InputProps={{
                inputProps: {
                  max: mapBounds[1][1],
                  min: mapBounds[0][1],
                  step: 0.001,
                },
              }}
            />
            <Box sx={ImgDoubleButtonContainerStyle}>
              <TextField
                id="outlined-number"
                label={t('app.map.downloadDataDialog.map.north')}
                type="number"
                value={downLoadBounds[1][0]}
                onChange={e => {
                  changeBounds([
                    [downLoadBounds[0][0], downLoadBounds[0][1]],
                    [
                      Number(e.target.value.replace(',', '.')),
                      downLoadBounds[1][1],
                    ],
                  ]);
                }}
                InputProps={{
                  inputProps: {
                    max: mapBounds[1][0],
                    min: mapBounds[0][0],
                    step: 0.001,
                  },
                }}
              />
              <TextField
                id="outlined-number"
                label={t('app.map.downloadDataDialog.map.south')}
                type="number"
                value={downLoadBounds[0][0]}
                onChange={e => {
                  changeBounds([
                    [
                      Number(e.target.value.replace(',', '.')),
                      downLoadBounds[0][1],
                    ],
                    [downLoadBounds[1][0], downLoadBounds[1][1]],
                  ]);
                }}
                InputProps={{
                  inputProps: {
                    max: mapBounds[1][0],
                    min: mapBounds[0][0],
                    step: 0.001,
                  },
                }}
              />
            </Box>
            <TextField
              id="outlined-number"
              label={t('app.map.downloadDataDialog.map.east')}
              type="number"
              value={downLoadBounds[1][1]}
              onChange={e => {
                changeBounds([
                  [downLoadBounds[0][0], downLoadBounds[0][1]],
                  [
                    downLoadBounds[1][0],
                    Number(e.target.value.replace(',', '.')),
                  ],
                ]);
              }}
              InputProps={{
                inputProps: {
                  max: mapBounds[1][1],
                  min: mapBounds[0][1],
                  step: 0.001,
                },
              }}
            />
          </Box>
          {showReset && (
            <Button size={'small'} onClick={resetBounds}>
              Ripristina coordinate originali
            </Button>
          )}
          {/*{JSON.stringify(downLoadBounds)}*/}
        </Box>

        <Box sx={FieldContainerStyle}>
          <Typography variant={'h6'} sx={MapDataSectionTextStyle}>
            {t('app.map.downloadDataDialog.map.timeRange')}
          </Typography>
          <Box sx={SliderContainerStyle}>
            <span>{times[0]}</span>
            <Slider
              sx={YearsSliderStyle}
              getAriaValueText={() =>
                t('app.map.downloadDataDialog.map.timeRangeLabel')
              }
              valueLabelDisplay="on"
              step={1}
              min={0}
              max={times.length - 1}
              value={[0, years[1]]}
              onChange={yearsHandleChange}
              valueLabelFormat={index => times[index]}
              disableSwap
            />
            <span>{times[times.length - 1]}</span>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MapDlData;
