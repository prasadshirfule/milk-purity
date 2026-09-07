import { Request, Response } from 'express';
import { dataRepository } from '../services/seedService';
import { sensorService } from '../services/sensorService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    const devices = await dataRepository.getDevices();
    // Never expose device apiKey in device listings
    const sanitized = devices.map(({ apiKey, ...rest }) => rest);
    res.json({ success: true, count: sanitized.length, data: sanitized });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDeviceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const device = await dataRepository.getDeviceById(req.params.id);
    if (!device) {
      res.status(404).json({ success: false, error: `Device '${req.params.id}' not found` });
      return;
    }
    // Never expose device apiKey in device inspection details
    const { apiKey, ...sanitized } = device;
    res.json({ success: true, data: sanitized });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deviceHeartbeat = async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await dataRepository.updateDeviceHeartbeat(req.params.id);
    if (!updated) {
      res.status(404).json({ success: false, error: `Device '${req.params.id}' not found` });
      return;
    }
    const { apiKey, ...sanitized } = updated;
    res.json({ success: true, message: 'Heartbeat acknowledged', data: sanitized });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const registerDevice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { deviceId, name, location } = req.body;
    if (!deviceId || typeof deviceId !== 'string' || deviceId.trim() === '') {
      res.status(400).json({ success: false, error: 'deviceId is required' });
      return;
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ success: false, error: 'name is required' });
      return;
    }

    const existing = await dataRepository.getDeviceById(deviceId.trim());
    if (existing) {
      res.status(409).json({ success: false, error: `Device with ID '${deviceId}' already exists` });
      return;
    }

    const generatedApiKey = `dev_sec_${Buffer.from(deviceId.trim() + '_' + Date.now().toString(36)).toString('hex')}`;

    const newDevice = await dataRepository.addDevice({
      deviceId: deviceId.trim(),
      name: name.trim(),
      deviceType: req.body.deviceType || 'ESP32_MILK_ANALYZER',
      connectionMode: req.body.connectionMode || 'REST_POLLING',
      status: 'UNKNOWN',
      location: location || 'Collection Desk',
      firmwareVersion: req.body.firmwareVersion || 'v1.0.0',
      apiKey: req.body.apiKey || generatedApiKey,
      macAddress: req.body.macAddress,
      ipAddress: req.body.ipAddress,
      calibrationStatus: req.body.calibrationStatus || 'CALIBRATED',
      lastCalibrationDate: req.body.lastCalibrationDate ? new Date(req.body.lastCalibrationDate) : new Date(),
      calibrationDueDate: req.body.calibrationDueDate ? new Date(req.body.calibrationDueDate) : new Date(Date.now() + 90 * 86400000),
      sensors: req.body.sensors || {
        temperature: true,
        ph: true,
        fat: true,
        density: true,
        conductivity: true,
        level: true
      }
    });

    // Audit log (never log secret credentials)
    await dataRepository.addAuditLog({
      action: 'DEVICE_REGISTERED',
      userId: req.user?.userId || 'SYSTEM',
      userName: req.user?.name || 'Administrator',
      role: req.user?.role || 'ADMIN',
      entityType: 'DEVICE',
      entityId: newDevice.deviceId,
      details: `Registered new node ${newDevice.deviceId} (${newDevice.name}) with mode ${newDevice.connectionMode}`
    });

    const { apiKey, ...sanitized } = newDevice;

    res.status(201).json({
      success: true,
      message: `Device '${newDevice.deviceId}' registered successfully`,
      data: {
        ...sanitized,
        provisioningKey: newDevice.apiKey,
        provisioningNotice: 'Store this X-Device-Key in your ESP32 microcontroller firmware. It will not be displayed again.'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDevice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const updated = await dataRepository.updateDevice(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: `Device '${req.params.id}' not found` });
      return;
    }

    // Audit log
    await dataRepository.addAuditLog({
      action: 'DEVICE_UPDATED',
      userId: req.user?.userId || 'SYSTEM',
      userName: req.user?.name || 'Administrator',
      role: req.user?.role || 'ADMIN',
      entityType: 'DEVICE',
      entityId: updated.deviceId,
      details: `Updated device metadata for ${updated.deviceId}`
    });

    const { apiKey, ...sanitized } = updated;

    res.json({
      success: true,
      message: `Device '${updated.deviceId}' updated successfully`,
      data: sanitized
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteDevice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const deleted = await dataRepository.deleteDevice(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: `Device '${req.params.id}' not found` });
      return;
    }

    // Audit log
    await dataRepository.addAuditLog({
      action: 'DEVICE_DELETED',
      userId: req.user?.userId || 'SYSTEM',
      userName: req.user?.name || 'Administrator',
      role: req.user?.role || 'ADMIN',
      entityType: 'DEVICE',
      entityId: req.params.id,
      details: `Deactivated/deleted device ${req.params.id}`
    });

    res.json({
      success: true,
      message: `Device '${req.params.id}' removed/deactivated successfully`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const ingestTelemetry = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceId = req.params.deviceId || req.body.deviceId;
    if (!deviceId) {
      res.status(400).json({ success: false, error: 'deviceId is required' });
      return;
    }

    const device = await dataRepository.getDeviceById(deviceId);
    if (!device) {
      res.status(404).json({ success: false, error: `Unknown device: '${deviceId}' is not registered` });
      return;
    }

    // Secure Device Authentication Check (Header-only: X-Device-Key or X-API-Key)
    const suppliedApiKey =
      (req.headers['x-device-key'] as string) ||
      (req.headers['x-api-key'] as string);

    if (device.apiKey && device.connectionMode !== 'DEMO' && device.deviceId !== 'ESP32-DEMO-001') {
      if (!suppliedApiKey || suppliedApiKey !== device.apiKey) {
        res.status(401).json({
          success: false,
          error: 'Device authentication failed: valid X-Device-Key header required'
        });
        return;
      }
    }

    const validation = sensorService.validateReading({ ...req.body, deviceId });
    if (!validation.valid || !validation.reading) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }

    const storeResult = sensorService.storeReading(validation.reading);

    if (storeResult.status === 'OUT_OF_ORDER') {
      res.status(409).json({
        success: false,
        error: storeResult.message,
        currentSnapshot: storeResult.current
      });
      return;
    }

    if (storeResult.status === 'DUPLICATE') {
      res.status(200).json({
        success: true,
        message: storeResult.message,
        reading: storeResult.current,
        isDuplicate: true
      });
      return;
    }

    // Update heartbeat only for valid, in-order accepted telemetry
    await dataRepository.updateDeviceHeartbeat(deviceId);

    res.status(200).json({
      success: true,
      message: 'Telemetry ingested successfully',
      reading: storeResult.current
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getLatestTelemetry = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceId = req.params.deviceId;
    const device = await dataRepository.getDeviceById(deviceId);
    if (!device) {
      res.status(404).json({ success: false, error: `Device '${deviceId}' not found` });
      return;
    }

    const reading = sensorService.getLatestReading(deviceId);
    let dataAgeSeconds: number | null = null;
    let isStale = false;

    if (reading && reading.timestamp) {
      const readingTime = new Date(reading.timestamp).getTime();
      if (!isNaN(readingTime)) {
        dataAgeSeconds = Math.max(0, Math.round((Date.now() - readingTime) / 1000));
        isStale = dataAgeSeconds > 60;
      }
    }

    const isLive = device.status === 'ONLINE' && !isStale;

    res.json({
      success: true,
      data: reading,
      deviceStatus: device.status,
      isLive,
      isStale,
      dataAgeSeconds
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
