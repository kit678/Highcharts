const styles = {
  container: `
    width: 100%;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    position: relative;
  `,
  controls: `
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    flex-wrap: wrap;
    align-items: flex-start;
    position: relative;
  `,
  ratioControl: `
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    flex: 0 0 auto;
    margin-right: 20px;
  `,
  ratioInput: `
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    width: 100px;
  `,
  ratioButton: `
    padding: 8px 12px;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  `,
  lockedButton: `
    background-color: #4caf50;
    color: white;
    border-color: #388e3c;
  `,
  unlockedButton: `
    background-color: #f44336;
    color: white;
    border-color: #d32f2f;
  `,
  ratioInfo: `
    margin-top: 4px;
    font-size: 12px;
    color: #666;
  `,
  ohlcContainer: `
    flex: 1 1 auto;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    min-width: 300px;
  `,
  ohlcDisplay: `
    background-color: rgba(255, 255, 255, 0.8);
    padding: 8px 12px;
    border-radius: 4px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    font-size: 14px;
    z-index: 10;
    position: relative;
  `,
  lineInfo: `
    margin-left: 20px;
    padding: 10px;
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 4px;
  `,
  lineInfoTitle: `
    margin: 0 0 5px 0;
    font-size: 16px;
  `,
  lineInfoContent: `
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
  `,
  chartWrapper: `
    position: relative;
    width: 100%;
    height: 600px;
  `,
  chartContainer: `
    width: 100%;
    height: 100%;
    position: relative;
  `,
  loadingChart: `
    display: flex;
    justify-content: center;
    align-items: center;
    height: 400px;
    background-color: #f9f9f9;
    border-radius: 8px;
  `
};

export default styles; 