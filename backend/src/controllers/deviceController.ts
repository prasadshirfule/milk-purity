import { Request, Response } from 'express';
import { dataRepository } from '../services/seedService';
import { sensorService } from '../services/sensorService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    const devices = await dataRepository.getDevices();
    res.json({ success: true, count: devices.length, data: devices });
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
    res.json({ success: true, data: device });
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
    res.json({ success: true, message: 'Heartbeat acknowledged', data: updated });
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

    const newDevice = await dataRepository.addDevice({
      deviceId: deviceId.trim(),
      name: name.trim(),
      deviceType: req.body.deviceType || 'ESP32_MILK_ANALYZER',
      connectionMode: req.body.connectionMode || 'REST_POLLING',
      status: 'UNKNOWN',
      location: location || 'Collection Desk',
      firmwareVersion: req.body.firmwareVersion || 'v1.0.0',
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

    // Audit log
    await dataRepository.addAuditLog({
      action: 'DEVICE_REGISTERED',
      userId: req.user?.userId || 'SYSTEM',
      userName: req.user?.name || 'Administrator',
      role: req.user?.role || 'ADMIN',
      entityType: 'DEVICE',
      entityId: newDevice.deviceId,
      details: `Registered new node ${newDevice.deviceId} (${newDevice.name}) with mode ${newDevice.connectionMode}`
    });

    res.status(201).json({
      success: true,
      message: `Device '${newDevice.deviceId}' registered successfully`,
      data: newDevice
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

    res.json({
      success: true,
      message: `Device '${updated.deviceId}' updated successfully`,
      data: updated
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

    const validation = sensorService.validateReading({ ...req.body, deviceId });
    if (!validation.valid || !validation.reading) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }

    sensorService.storeReading(validation.reading);
    await dataRepository.updateDeviceHeartbeat(deviceId);

    res.status(200).json({
      success: true,
      message: 'Telemetry ingested successfully',
      reading: validation.reading
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
    const isLive = device.status === 'ONLINE';

    res.json({
      success: true,
      data: reading,
      deviceStatus: device.status,
      isLive
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
